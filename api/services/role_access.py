from database.operations.users_roles import get_roles_by_discord_ids
import logging

logger = logging.getLogger(__name__)

def check_user_has_access_role(discord_role_ids: list[str]) -> bool:
    """
    Check if any of the user's Discord roles grant access to the application.
    
    Args:
        discord_role_ids: List of Discord role IDs from the user's guild membership
        
    Returns:
        bool: True if user has at least one role that grants access
    """
    if not discord_role_ids:
        logger.info("No Discord roles provided - access denied")
        return False
    
    try:
        # Use operations layer to get role details
        user_roles = get_roles_by_discord_ids(discord_role_ids)
        
        # Check if any roles grant access
        access_granting_roles = [role for role in user_roles if role["grants_access"]]
        
        if access_granting_roles:
            role_names = [role["role_name"] for role in access_granting_roles]
            logger.info(f"User has access-granting roles: {role_names}")
            return True
        else:
            logger.info(f"User's roles {discord_role_ids} do not grant access")
            return False
            
    except Exception as e:
        logger.error(f"Error checking role access: {e}")
        return False

def get_user_access_roles(discord_role_ids: list[str]) -> list[dict]:
    """
    Get detailed information about which of the user's roles grant access.
    
    Args:
        discord_role_ids: List of Discord role IDs from the user's guild membership
        
    Returns:
        list[dict]: List of roles with their details, ordered by access-granting first
    """
    if not discord_role_ids:
        return []
    
    try:
        # Use operations layer to get role details
        user_roles = get_roles_by_discord_ids(discord_role_ids)
        
        # Sort by grants_access (True first) then by role_name
        sorted_roles = sorted(user_roles, key=lambda x: (not x["grants_access"], x["role_name"]))
        
        # Transform to service layer format
        return [
            {
                "discord_id": role["role_discord_id"],
                "name": role["role_name"], 
                "description": role["role_description"],
                "grants_access": role["grants_access"]
            }
            for role in sorted_roles
        ]
        
    except Exception as e:
        logger.error(f"Error getting user access roles: {e}")
        return []
