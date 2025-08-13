from database.connection import SessionLocal
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

def check_user_has_access_role(discord_role_ids: list[str]) -> bool:
    return False

def sync_user_roles(user_id: int, discord_role_ids: list[str]) -> bool:
    return False

def get_user_access_summary(user_ids: int) -> dict:
    return []