from sqlalchemy.orm import Session as DBSession
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from typing import Optional
from datetime import datetime, timedelta


from ..connection import SessionLocal

def get_user_roles(user_id: int) -> list[dict]:
    """
    get_user_roles
    Params: user_id: int
    Return: list[dict] (list of roles)
    Given a user_id, returns all the roles the user has
    """
    db: DBSession = SessionLocal()
    try:
        query = text("""
            SELECT r.role_discord_id, r.role_name, r.grants_access FROM roles r
            JOIN users_roles ur ON r.role_id = ur.role_id 
            WHERE ur.user_id = :user_id
            Order BY r.role_name 
        """)
        result = db.execute(query, {"user_id": user_id})
        rows = result.fetchall()
        return [
            {
                "role_discord_id":row[0],
                "role_name":row[1],
                "grants_access":row[2]
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error occurred: {e}")
        return []
    finally:
        db.close()

def add_user_role(user_id: int, role_id: int) -> bool:
    """
    Definition: add_user_role
    Params: user_id: int, role_id: int
    Return: bool (successful or not)
    Given a user_id and role_id, adds them to he users_roles table
    """
    db: DBSession = SessionLocal()
    try:
        query = text("""
                    INSERT INTO users_roles (user_id, role_id)
                    VALUES (:user_id, :role_id)
                     """)
        db.execute(query, {"user_id": user_id, "role_id": role_id})
        db.commit()
        return True
    except IntegrityError as e:
        print(f"Integrity error, duplicate/constraint violation: {e}")
        db.rollback()
        return False
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def remove_user_role(user_id: int, role_id: int) -> bool:
    """
    Definition: remove_user_role
    Params: user_id: int, role_id: int
    Return bool (success or not)
    Removes a given role from the give user
       returns true if successful, false if not
    """
    db: DBSession = SessionLocal()
    try:
        query = text("""
                    DELETE FROM users_roles
                    WHERE user_id = :user_id AND role_id = :role_id
                     """)
        result = db.execute(query, {"user_id": user_id, "role_id": role_id})
        db.commit()
        return result.rowcount > 0
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def remove_role_from_all_users(role_id: int) -> bool:
    """
    Definition: remove_role_from_all_users
    Params: role_id: int
    Return: bool (success or not)
    Removes a specific role from ALL users who have it.
    Used when deleting a role entirely from the system.
    Returns true if any user-role relationships were deleted, false if not
    """
    db: DBSession = SessionLocal()
    try:
        query = text("""
                    DELETE FROM users_roles
                    WHERE role_id = :role_id
                     """)
        result = db.execute(query, {"role_id": role_id})
        db.commit()
        return result.rowcount > 0
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def clear_user_roles(user_id: int) -> bool:
    """
    Definition: clear_user_roles
    Params: user_id: int
    Return: bool (success or not)
    Removes all the roles from a given user id.
       returns true if successful, false if not
    """
    db: DBSession = SessionLocal()
    try:
        query = text("""
                    DELETE FROM users_roles
                    WHERE user_id = :user_id
                     """)
        result = db.execute(query, {"user_id": user_id})
        db.commit()
        return result.rowcount > 0
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def get_roles_by_discord_ids(discord_role_ids: list[str]) -> list[dict]:
    """
    Definition: get_roles_by_discord_ids
    Params: discord_role_ids: list of str
    Return: list[dict] (roles matching the provided Discord role IDs)
    Given a list of Discord role IDs, returns the corresponding role information
    from the roles table. Useful for looking up role details when you have
    Discord role IDs from a Discord server.
    """
    if not discord_role_ids:
        return []
    
    db: DBSession = SessionLocal()
    try:
        # Create placeholders for the IN clause
        placeholders = ','.join(':role_id_' + str(i) for i in range(len(discord_role_ids)))
        
        query = text(f"""
            SELECT r.role_discord_id, r.role_name, r.grants_access, r.role_description 
            FROM roles r
            WHERE r.role_discord_id IN ({placeholders})
            ORDER BY r.role_name 
        """)
        
        # Create parameters dictionary
        params = {'role_id_' + str(i): discord_role_ids[i] for i in range(len(discord_role_ids))}
        
        result = db.execute(query, params)
        rows = result.fetchall()
        
        return [
            {
                "role_discord_id": row[0],
                "role_name": row[1],
                "grants_access": row[2],
                "role_description": row[3]
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error occurred: {e}")
        return []
    finally:
        db.close()
    