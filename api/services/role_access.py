from database.operations.permission_operations import discord_roles_have_permission, get_user_permissions
import logging

logger = logging.getLogger(__name__)


def check_site_access(discord_role_ids: list[str]) -> bool:
    """Check if any of the user's live Discord roles carry the site_access permission.
    Called during login/session check before DB roles are guaranteed to be synced."""
    if not discord_role_ids:
        logger.info("No Discord roles provided - site access denied")
        return False
    try:
        result = discord_roles_have_permission(discord_role_ids, "site_access")
        logger.info(f"Site access check for {discord_role_ids}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error checking site access: {e}")
        return False


def check_user_has_permission(user_id: int, permission: str) -> bool:
    """Check if a user has a specific permission via any of their assigned roles."""
    try:
        return permission in get_user_permissions(user_id)
    except Exception as e:
        logger.error(f"Error checking permission '{permission}' for user {user_id}: {e}")
        return False
