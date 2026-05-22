from fastapi import APIRouter, Request, HTTPException, Response, Depends
from fastapi.responses import RedirectResponse
from typing import Dict, Any
from sqlalchemy.orm import Session
import os
import httpx
import secrets
import json
from datetime import datetime, timedelta
from .session import get_session, is_session_valid, update_session_access
from database.connection import get_db
from database.operations.users.get_user_by_id import (
    get_user_by_id
)
from database.operations.session_operations import get_user_from_session
from database.operations.session_operations import invalidate_all_user_sessions
from database.operations.session_operations import delete_all_user_sessions
from database.models.user import UserStatus
from services.sync_user_roles import get_user_current_roles
from services.role_access import check_user_has_access_role
from services.sync_user_roles import sync_user_roles
from services.discord_api import get_user_roles_from_discord_api

router = APIRouter()


@router.get("/me")
async def get_current_user(request: Request):
    """
    Check if user is authenticated and return user data
    """
    session_id = request.cookies.get("session_id")
    
    # Is there a session?
    if not session_id:
        return {
            "authenticated": False,
            "message": "No session found."
        }
    
    # If yes, is the session valid?
    session = get_session(session_id)
    if not session or not is_session_valid(session):
        return {
            "authenticated": False,
            "message": "Session expired or invalid."
        }
    
    # Is there a user associated with the session? Get from db
    user = get_user_from_session(session_id)
    if not user:
        return {
            "authenticated": False,
            "message": "User not found."
        }
    
    # Check if user still has an access granting role
    db_user_roles = get_user_current_roles(user.id)
    db_user_discord_roles = [role['discord_id'] for role in db_user_roles]

    live_discord_roles = await get_user_roles_from_discord_api(user.discord_id)
    has_access = check_user_has_access_role(live_discord_roles)

    # sync if roles have changed
    if set(db_user_discord_roles) != set(live_discord_roles):
        sync_user_roles(user.id, live_discord_roles)
    
    if not has_access:
        print(f"Session Check: Access - Role denied.")
        deleted_count = delete_all_user_sessions(user.id)
        print(f"Deleted {deleted_count} sessions for user {user.id}")
        return {
            "authenticated": False,
            "message": "Access denied."
        }
    
    # Update session last accessed time
    update_session_access(session_id)
    
    # Return the user data
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "discord_username": user.discord_username,
            "server_nickname": user.server_nickname,  # Include server nickname
            "status": user.status.value  # UserStatus is an enum, so we need .value
        }
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout user by clearing session
    """
    session_id = request.cookies.get("session_id")

    # Invalidate all sessions for this user across all devices
    if session_id:
        user = get_user_from_session(session_id)
        if user:
            delete_all_user_sessions(user.id)

    # Clear the session cookie on this device
    response.delete_cookie("session_id")

    return {"message": "Logged out successfully"}
