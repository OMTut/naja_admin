from database.connection import SessionLocal
from sqlalchemy import text
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
        session = SessionLocal()
        
        # Check if any of the user's Discord roles have grants_access = true
        query = text("""
            SELECT role_discord_id, role_name, grants_access 
            FROM roles 
            WHERE role_discord_id = ANY(:role_ids) 
            AND grants_access = true
        """)
        
        result = session.execute(query, {"role_ids": discord_role_ids})
        matching_roles = result.fetchall()
        
        session.close()
        
        if matching_roles:
            role_names = [row[1] for row in matching_roles]
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
        list[dict]: List of roles that grant access with their details
    """
    if not discord_role_ids:
        return []
    
    try:
        session = SessionLocal()
        
        query = text("""
            SELECT role_discord_id, role_name, role_description, grants_access 
            FROM roles 
            WHERE role_discord_id = ANY(:role_ids)
            ORDER BY grants_access DESC, role_name
        """)
        
        result = session.execute(query, {"role_ids": discord_role_ids})
        roles = result.fetchall()
        
        session.close()
        
        return [
            {
                "discord_id": row[0],
                "name": row[1], 
                "description": row[2],
                "grants_access": row[3]
            }
            for row in roles
        ]
        
    except Exception as e:
        logger.error(f"Error getting user access roles: {e}")
        return []
