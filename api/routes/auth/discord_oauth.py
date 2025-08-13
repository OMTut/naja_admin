from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from typing import Dict, Any
import os
import httpx
from datetime import datetime

# User database operations
from database.operations.users import (
    get_user_by_discord_id,
    store_user_pending_approval,
    is_user_approved,
    update_user_discord_info
)
from database.models.user import UserStatus


from .session import get_session, is_session_expired, update_session_access
from services.role_access import check_user_has_access_role, get_user_access_roles
from services.sync_user_roles import sync_user_roles

router = APIRouter()

async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange Discord authorization code for access token"""
    token_url = os.getenv("DISCORD_TOKEN_URL")
    
    data = {
        "client_id": os.getenv("DISCORD_CLIENT_ID"),
        "client_secret": os.getenv("DISCORD_CLIENT_SECRET"),
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": os.getenv("DISCORD_REDIRECT_URI"),
    }
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        return response.json()

async def get_discord_user_info(access_token: str) -> Dict[str, Any]:
    """Get Discord user information using access token"""
    user_url = os.getenv("DISCORD_USER_URL")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(user_url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info from Discord")
        
        return response.json()
    
async def get_discord_user_guilds(access_token: str) -> Dict[str, Any]:
    """Get Discord user's guilds (servers) using access token"""
    guilds_url = "https://discord.com/api/users/@me/guilds"
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(guilds_url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user guilds from Discord")
        
        return response.json()

async def get_discord_guild_member(access_token: str, guild_id: str) -> Dict[str, Any]:
    """Get Discord user's member details for a specific guild (includes roles)"""
    member_url = f"https://discord.com/api/users/@me/guilds/{guild_id}/member"
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(member_url, headers=headers)
        
        if response.status_code != 200:
            # User might not be in guild or insufficient permissions
            return None
        
        return response.json()
    
def is_member_of_target_guild(user_guilds: Dict[str, Any], target_guild_id:str) -> tuple[bool, str]:
    """Check if user is a member of the target guild
    Returns: (is_member: bool, guild_id: str)
    """
    for guild in user_guilds:
        if guild['id'] == target_guild_id:
            return True, guild['id']
    return False, None

async def check_user_guild_roles(access_token: str, guild_id: str, required_roles: list = None) -> Dict[str, Any]:
    """Check user's roles in a specific guild and extract server nickname
    
    Args:
        access_token: Discord OAuth access token
        guild_id: Discord guild ID
        required_roles: List of role names/IDs that are acceptable (optional)

    Returns:
        Dict with member info including roles and nickname
    """
    member_data = await get_discord_guild_member(access_token, guild_id)

    if not member_data:
        return {
            "is_member": False,
            "roles": [],
            "has_required_role": False,
            "nickname": None
        }

    user_roles = member_data.get('roles', [])
    server_nickname = member_data.get('nick')  # Extract server nickname

    # If no required roles specified, just return membership info
    if not required_roles:
        return {
            "is_member": True,
            "roles": user_roles,
            "has_required_role": True,  # No specific role required
            "nickname": server_nickname,  # Include nickname
            "member_data": member_data
        }

    # Check if user has any of the required roles
    has_required_role = any(role in user_roles for role in required_roles)

    return {
        "is_member": True,
        "roles": user_roles,
        "has_required_role": has_required_role,
        "nickname": server_nickname,  # Include nickname
        "member_data": member_data
    }

# Testing version
@router.get("/discord/callback")
async def discord_callback(code: str = None, error: str = None):
    """
    Handle Discord OAuth callback
    """
    frontend_url = os.getenv("FRONTEND_URL")

    # Check for errors from Discord
    if error:
        return RedirectResponse(
            url=f"{frontend_url}/?error=discord_auth_failed&message=Access Denied. Error connecting to Discord"
        )
    if not code:
        return RedirectResponse(
            url=f"{frontend_url}/?error=discord_auth_failed&message=ERROR: No code provided"
        )
    try:
        # Exchange code for access token
        token_data = await exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user info from Discord
        discord_user = await get_discord_user_info(access_token)
        print(discord_user)
        user_servers = await get_discord_user_guilds(access_token)
        for server in user_servers:
            print(f"Server: {server['name']} (ID: {server['id']})")

        # Check if user is a member of guild
        target_guild = os.getenv("TARGET_SERVER_ID")
        is_member, guild_id = is_member_of_target_guild(user_servers, target_guild)
            
        if not is_member:
            return RedirectResponse(
                url=f"{frontend_url}/?error=not_in_target_guild&message=Access Denied. Approved Membership in Discord Required."
            )
            
        # Check user's roles in the guild (optional - specify required roles)
        # required_roles = ["123456789", "987654321"]  # Role IDs for specific ranks
        guild_id = guild_id or os.getenv("TARGET_SERVER_ID")
        guild_member_info = await check_user_guild_roles(access_token, guild_id)
            
        print(f"User roles in {target_guild}: {guild_member_info.get('roles', [])}")
        
        # Check if user's Discord roles grant access to the application
        user_discord_roles = guild_member_info.get('roles', [])
        has_access = check_user_has_access_role(user_discord_roles)
        
        if not has_access:
            # Get role details for better error message
            user_role_details = get_user_access_roles(user_discord_roles)
            print(f"Access denied - user's roles: {user_role_details}")
            return RedirectResponse(
                url=f"{frontend_url}/?error=insufficient_role&message=Access Denied. You need an approved role in the Discord server to access this application."
            )
        
        print(f"Access granted - user has required roles")

        # Check if user already exists
        existing_user = get_user_by_discord_id(discord_user["id"])
        print(existing_user)
        if existing_user:
            # Check if Discord data (username, email) has changed
            if existing_user.discord_username != discord_user['username'] or \
                existing_user.email != discord_user.get('email') or \
                existing_user.server_nickname != guild_member_info.get('nickname'):
                update_user_discord_info(existing_user.id, discord_user)
            
            # Check if user is approved
            if not is_user_approved(existing_user):
                return RedirectResponse(
                    url=f"{frontend_url}/?error=pending_approval&message=Your account is pending admin approval"
                )
            
            # If user is approved: sync user_role table
            sync_user_roles(existing_user.id, user_discord_roles)

            # If user is approved, create session and redirect
            print(f"User {existing_user.id} is approved, creating session")
            from .session import create_session
            session_id = create_session(existing_user.id)

            redirect_response = RedirectResponse(
                url=f"{frontend_url}/?auth=success&message=Login successful"
            )
            redirect_response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                secure=os.getenv("ENVIRONMENT") == "production",
                samesite="lax",
                max_age=86400 * 7  # 7 days
            )
            return redirect_response
        else:
            # # Check if user is a member of Naja Echó guild
            # target_guild = os.getenv("TARGET_SERVER_ID")
            # is_member, guild_id = is_member_of_target_guild(user_servers, target_guild)
            
            # if not is_member:
            #     return RedirectResponse(
            #         url=f"{frontend_url}/?error=not_in_target_guild&message=Access Denied. Approved Membership in Discord Required."
            #     )
            
            # # Check user's roles in the guild (optional - specify required roles)
            # # required_roles = ["123456789", "987654321"]  # Role IDs for specific ranks
            # guild_id = guild_id or os.getenv("TARGET_SERVER_ID")
            # guild_member_info = await check_user_guild_roles(access_token, guild_id)
            
            # print(f"User roles in {target_guild}: {guild_member_info.get('roles', [])}")
            
            # Optionally check for specific roles here
            # if not guild_member_info.get('has_required_role'):
            #     return RedirectResponse(
            #         url=f"{frontend_url}/?error=insufficient_role&message=You need a specific role in the guild to register"
            #     )

            # Debug: Print the Discord user data
            print(f"Creating new user with Discord data: {discord_user}")
            print(f"Server nickname: {guild_member_info.get('nickname')}")
            
            # Prepare user data with server nickname
            user_data_with_nickname = discord_user.copy()
            user_data_with_nickname['server_nickname'] = guild_member_info.get('nickname')

            new_user = store_user_pending_approval(user_data_with_nickname)
            if new_user:
                # Redirect with pending message
                return RedirectResponse(
                    url=f"{frontend_url}/?auth=pending&message=Your account has been submitted for admin approval"
                )
            else:
                # User already exists or error occurred
                return RedirectResponse(
                    url=f"{frontend_url}/?error=user_exists&message=Account already exists"
                )

    
    except HTTPException as e:
        return RedirectResponse(
            url=f"{frontend_url}/?error=discord_auth_failed&message={e.detail}"
        )
    except Exception as e:
        return RedirectResponse(
            url=f"{frontend_url}/?error=discord_auth_failed&message=An unexpected error occurred"
        )

