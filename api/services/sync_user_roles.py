from database.connection import SessionLocal
from sqlalchemy import text
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
        user_discord_roles = []  # Will clear all roles below
    
    try:
        session = SessionLocal()
        
        # Step 1: Find which Discord roles exist in our database
        query = text("""
            SELECT role_id, role_discord_id, role_name 
            FROM roles 
            WHERE role_discord_id = ANY(:discord_role_ids)
        """)
        
        result = session.execute(query, {"discord_role_ids": user_discord_roles})
        valid_roles = result.fetchall()
        
        valid_role_ids = [row[0] for row in valid_roles]  # Get role_id (primary key)
        role_names = [row[2] for row in valid_roles]       # Get role names for logging
        
        logger.info(f"User {user_id} has {len(valid_roles)} valid roles: {role_names}")
        
        # Step 2: Remove all existing role assignments for this user
        delete_query = text("DELETE FROM users_roles WHERE user_id = :user_id")
        session.execute(delete_query, {"user_id": user_id})
        
        # Step 3: Add new role assignments
        if valid_role_ids:
            for role_id in valid_role_ids:
                insert_query = text("""
                    INSERT INTO users_roles (user_id, role_id) 
                    VALUES (:user_id, :role_id)
                """)
                session.execute(insert_query, {
                    "user_id": user_id, 
                    "role_id": role_id
                })
        
        # Commit all changes
        session.commit()
        session.close()
        
        logger.info(f"Successfully synced {len(valid_role_ids)} roles for user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error syncing roles for user {user_id}: {e}")
        if 'session' in locals():
            session.rollback()
            session.close()
        return False


def get_user_current_roles(user_id: int) -> list[dict]:
    """
    Get the user's current role assignments from the database.
    
    Args:
        user_id: Database user ID
        
    Returns:
        list[dict]: List of roles currently assigned to the user
    """
    try:
        session = SessionLocal()
        
        query = text("""
            SELECT r.role_id, r.role_discord_id, r.role_name, r.role_description, r.grants_access
            FROM roles r
            JOIN users_roles ur ON r.role_id = ur.role_id
            WHERE ur.user_id = :user_id
            ORDER BY r.role_name
        """)
        
        result = session.execute(query, {"user_id": user_id})
        roles = result.fetchall()
        
        session.close()
        
        return [
            {
                "role_id": row[0],
                "discord_id": row[1],
                "name": row[2],
                "description": row[3],
                "grants_access": row[4]
            }
            for row in roles
        ]
        
    except Exception as e:
        logger.error(f"Error getting current roles for user {user_id}: {e}")
        return []
