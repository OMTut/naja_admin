"""
Bot-facing routes — called by Gibbs, not the frontend.
"""
import os
import hmac
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List

from database.operations.users.get_user_by_discord_id import get_user_by_discord_id
from services.sync_user_roles import sync_user_roles_preserving_app

router = APIRouter()


class SyncRolesRequest(BaseModel):
    discord_id: str
    role_discord_ids: List[str]
    all_guild_role_ids: List[str]


def _check_api_key(x_api_key: str):
    expected = os.getenv("BOT_API_KEY")
    if not expected or not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/sync-roles")
async def sync_roles_from_discord(body: SyncRolesRequest, x_api_key: str = Header(...)):
    """
    Called by Gibbs when a member's roles change in Discord.
    Syncs Discord role changes while preserving app-only roles.
    """
    _check_api_key(x_api_key)

    user = get_user_by_discord_id(body.discord_id)
    if not user:
        return {"success": True, "synced": False, "reason": "user not found"}

    sync_user_roles_preserving_app(user.id, body.role_discord_ids, body.all_guild_role_ids)
    return {"success": True, "synced": True}
