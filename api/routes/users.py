"""
User administration routes
"""
import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database.connection import get_db
from database.models.user import User, UserStatus
from database.operations.users_roles import get_user_roles, clear_user_roles, add_user_role
from services.sync_user_roles import sync_user_roles_preserving_app
from services.discord_api import get_member_profile, get_all_guild_role_ids
from database.models.role import Role as RoleModel
from dependencies.auth import require_session, require_permission

router = APIRouter(dependencies=[Depends(require_permission("admin"))])


# Pydantic models for request/response
class UserUpdate(BaseModel):
    discord_username: Optional[str] = None
    server_nickname: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None


class UserRoleInfo(BaseModel):
    role_name: str


class UserResponse(BaseModel):
    id: int
    discord_id: str
    discord_username: str
    global_name: Optional[str]
    server_nickname: Optional[str]
    email: Optional[str]
    status: str
    roles: List[UserRoleInfo] = []
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime

    class Config:
        from_attributes = True


# User administration endpoints
@router.get("", response_model=List[UserResponse])
async def get_all_users(db: Session = Depends(get_db), _=Depends(require_session)):
    """Get all users"""
    users = db.query(User).all()
    # Convert UserStatus enum to string for response
    result = []
    for user in users:
        roles = get_user_roles(user.id)
        user_dict = {
            "id": user.id,
            "discord_id": user.discord_id,
            "discord_username": user.discord_username,
            "global_name": user.global_name,
            "server_nickname": user.server_nickname,
            "email": user.email,
            "status": user.status.value,
            "roles": [{"role_name": r["role_name"]} for r in roles],
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "last_login_at": user.last_login_at,
        }
        result.append(user_dict)
    return result


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    """Get a specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    roles = get_user_roles(user.id)
    return {
        "id": user.id,
        "discord_id": user.discord_id,
        "discord_username": user.discord_username,
        "global_name": user.global_name,
        "server_nickname": user.server_nickname,
        "email": user.email,
        "status": user.status.value,
        "roles": [{"role_name": r["role_name"]} for r in roles],
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login_at": user.last_login_at,
    }


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), _=Depends(require_session)):
    """Update an existing user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.discord_username is not None:
        user.discord_username = user_data.discord_username
    
    if user_data.server_nickname is not None:
        user.server_nickname = user_data.server_nickname
    
    if user_data.email is not None:
        user.email = user_data.email
    
    if user_data.status is not None:
        try:
            user.status = UserStatus(user_data.status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join([s.value for s in UserStatus])}"
            )
    
    db.commit()
    db.refresh(user)

    roles = get_user_roles(user.id)
    return {
        "id": user.id,
        "discord_id": user.discord_id,
        "discord_username": user.discord_username,
        "global_name": user.global_name,
        "server_nickname": user.server_nickname,
        "email": user.email,
        "status": user.status.value,
        "roles": [{"role_name": r["role_name"]} for r in roles],
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login_at": user.last_login_at,
    }


@router.put("/{user_id}/roles")
async def set_user_roles(user_id: int, role_ids: List[int], db: Session = Depends(get_db), _=Depends(require_session)):
    """Replace a user's roles with the provided list of role IDs"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate all role IDs exist
    for role_id in role_ids:
        if not db.query(RoleModel).filter(RoleModel.role_id == role_id).first():
            raise HTTPException(status_code=404, detail=f"Role {role_id} not found")

    # Push to Discord first, then save only what Gibbs confirmed
    applied_discord_ids, warning = await _push_roles_to_discord(user.discord_id, role_ids, db)

    if applied_discord_ids is not None:
        # Gibbs is configured — map the applied Discord IDs back to internal role IDs
        applied_roles = db.query(RoleModel).filter(
            RoleModel.role_discord_id.in_(applied_discord_ids)
        ).all()
        role_ids_to_save = [r.role_id for r in applied_roles]
    else:
        # Gibbs not configured — save all requested roles
        role_ids_to_save = role_ids

    clear_user_roles(user_id)
    for role_id in role_ids_to_save:
        add_user_role(user_id, role_id)

    roles = get_user_roles(user_id)
    return {
        "roles": [{"role_name": r["role_name"]} for r in roles],
        "warning": warning,
    }


async def _push_roles_to_discord(
    discord_id: str, role_ids: List[int], db: Session
) -> tuple[Optional[List[str]], Optional[str]]:
    """Call Gibbs to update the member's Discord roles.
    Returns (applied_discord_ids, warning):
      - applied_discord_ids: the managed Discord role IDs now on the member (None = Gibbs not configured)
      - warning: human-readable message if some roles failed, else None
    """
    gibbs_url = os.getenv("GIBBS_API_URL")
    api_key = os.getenv("BOT_API_KEY")
    if not gibbs_url or not api_key:
        return None, None  # Gibbs not configured — caller saves all requested roles

    assigned = []
    for role_id in role_ids:
        role = db.query(RoleModel).filter(RoleModel.role_id == role_id).first()
        if role:
            assigned.append(role.role_discord_id)

    managed = [r.role_discord_id for r in db.query(RoleModel).all()]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{gibbs_url}/api/members/{discord_id}/roles",
                json={"assigned_role_discord_ids": assigned, "managed_role_discord_ids": managed},
                headers={"X-API-Key": api_key},
                timeout=10.0,
            )
        if not response.is_success:
            detail = response.json().get("detail", f"HTTP {response.status_code}")
            return None, f"Gibbs: {detail}"

        data = response.json()
        applied = data.get("applied_role_discord_ids", [])
        not_in_discord = data.get("not_in_discord_ids", [])
        errors = data.get("errors", [])
        warning = ("Gibbs: Missing permissions for: " + ", ".join(errors)) if errors else None
        return applied + not_in_discord, warning
    except Exception as e:
        return None, f"Gibbs: {e}"


@router.post("/{user_id}/resync")
async def resync_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    """Re-sync a user's Discord profile and roles from Discord via Gibbs."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    gibbs_url = os.getenv("GIBBS_API_URL")
    api_key = os.getenv("BOT_API_KEY")
    if not gibbs_url or not api_key:
        raise HTTPException(status_code=503, detail="Gibbs is not configured")

    # Fetch profile info and roles concurrently
    import asyncio
    profile_task = asyncio.create_task(get_member_profile(user.discord_id))
    guild_role_task = asyncio.create_task(get_all_guild_role_ids())

    headers = {"X-API-Key": api_key}
    try:
        async with httpx.AsyncClient() as client:
            member_resp = await client.get(
                f"{gibbs_url}/api/members/{user.discord_id}/roles",
                headers=headers,
                timeout=10.0,
            )
        if not member_resp.is_success:
            raise HTTPException(status_code=502, detail="Failed to fetch member roles from Discord")
        role_discord_ids = member_resp.json().get("role_discord_ids", [])
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail=f"Cannot reach Gibbs at {gibbs_url} — is the bot running?")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gibbs did not respond in time")

    profile, all_guild_role_ids = await asyncio.gather(profile_task, guild_role_task)

    # Update profile fields (email excluded — only refreshed on OAuth login)
    if profile:
        if profile.get("username"):
            user.discord_username = profile["username"]
        user.global_name = profile.get("global_name")
        user.server_nickname = profile.get("server_nickname")
        db.commit()
        db.refresh(user)

    sync_user_roles_preserving_app(user_id, role_discord_ids, all_guild_role_ids)

    roles = get_user_roles(user_id)
    return {
        "discord_username": user.discord_username,
        "global_name": user.global_name,
        "server_nickname": user.server_nickname,
        "roles": [{"role_name": r["role_name"]} for r in roles],
    }


@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user_id} deleted successfully"}
