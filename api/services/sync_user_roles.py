from database.operations.users_roles import (
    get_user_roles,
    clear_user_roles,
    add_user_role,
    get_roles_by_discord_ids
)
import logging

logger = logging.getLogger(__name__)

def sync_user_roles(user_id: int, user_discord_roles: list[str]) -> bool:
    """
    Sync user's roles in the users_roles table based on their Discord roles.
    
    This function:
    1. Removes all existing role assignments for the user
    2. Adds new role assignments based on their current Discord roles
    3. Only syncs roles that exist in our database
    
    Args:
        user_id: Database user ID
        user_discord_roles: List of Discord role IDs from Discord API
        
    Returns:
        bool: True if sync was successful, False otherwise
    """
    if not user_discord_roles:
        logger.info(f"No Discord roles provided for user {user_id} - clearing all roles")
        # Clear all roles and return
        return clear_user_roles(user_id)
    
    try:
        # Step 1: Find which Discord roles exist in our database
        valid_roles = get_roles_by_discord_ids(user_discord_roles)
        
        role_names = [role["role_name"] for role in valid_roles]
        logger.info(f"User {user_id} has {len(valid_roles)} valid roles: {role_names}")
        
        # Step 2: Remove all existing role assignments for this user
        clear_result = clear_user_roles(user_id)
        if not clear_result and len(get_user_roles(user_id)) > 0:
            # If clear failed but user still has roles, something went wrong
            logger.error(f"Failed to clear existing roles for user {user_id}")
            return False
        
        # Step 3: Add new role assignments
        if valid_roles:
            success_count = 0
            for role in valid_roles:
                # We need to get the role_id from the database operations
                # The get_roles_by_discord_ids returns role info but we need the internal role_id
                # Let's get it from a role operations function
                from database.operations.role_operations import getRoleIdByDiscordId
                
                role_id = getRoleIdByDiscordId(role["role_discord_id"])
                if role_id and add_user_role(user_id, role_id):
                    success_count += 1
                else:
                    logger.warning(f"Failed to add role {role['role_name']} to user {user_id}")
            
            if success_count == len(valid_roles):
                logger.info(f"Successfully synced {success_count} roles for user {user_id}")
                return True
            else:
                logger.error(f"Only synced {success_count}/{len(valid_roles)} roles for user {user_id}")
                return False
        else:
            logger.info(f"No valid roles to sync for user {user_id}")
            return True
        
    except Exception as e:
        logger.error(f"Error syncing roles for user {user_id}: {e}")
        return False


def get_user_current_roles(user_id: int) -> list[dict]:
    """
    Get the user's current role assignments from the database.
    
    This is a higher-level service function that provides enhanced formatting
    compared to the basic operations layer function.
    
    Args:
        user_id: Database user ID
        
    Returns:
        list[dict]: List of roles currently assigned to the user with enhanced formatting
    """
    try:
        # Use the operations layer function
        basic_roles = get_user_roles(user_id)
        
        # Transform to the service layer format with enhanced field names
        return [
            {
                "discord_id": role["role_discord_id"],
                "name": role["role_name"],
                "grants_access": role["grants_access"]
            }
            for role in basic_roles
        ]
        
    except Exception as e:
        logger.error(f"Error getting current roles for user {user_id}: {e}")
        return []
