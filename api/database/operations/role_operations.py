from sqlalchemy.orm import Session as DBSession
from sqlalchemy.exc import IntegrityError
from typing import Optional
from datetime import datetime, timedelta

from ..models.session import Session
from ..models.user import User
from ..models.role import Role
from ..connection import SessionLocal


####################################
# getRoleIdByName
# Params: role_name: str
# Give it a role name and it returns the role Id if it exists
####################################
def getRoleIdByName(role_name: str) -> Optional[int]:
    db: DBSession = SessionLocal()
    try:
        role = db.query(Role).filter(Role.role_name == role_name).first()
        return role.role_id if role else None
    except Exception as e:
        print(f"Error occurred: {e}")
        return None
    finally:
        db.close()

####################################
# getRoleIdByDiscordId
# Params: discord_id: str
# Give it a Discord role ID and it returns the database role ID if it exists
####################################
def getRoleIdByDiscordId(discord_id: str) -> Optional[int]:
    db: DBSession = SessionLocal()
    try:
        role = db.query(Role).filter(Role.role_discord_id == discord_id).first()
        return role.role_id if role else None
    except Exception as e:
        print(f"Error occurred: {e}")
        return None
    finally:
        db.close()

#####################################
# getRoleByRoleId
# Params: role_id: int
# Returns the role object if found, else None
#####################################
def getRoleByRoleId(role_id: int) -> Optional[Role]:
    db: DBSession = SessionLocal()
    try:
        role = db.query(Role).filter(Role.role_id == role_id).first()
        return role
    except Exception as e:
        print(f"Error occurred: {e}")
        return None
    finally:
        db.close()

#####################################
# getAllRoles
# Returns a list of all roles in the database
#####################################
def getAllRoles() -> list[Role]:
    db: DBSession = SessionLocal()
    try:
        roles = db.query(Role).all()
        return roles
    except Exception as e:
        print(f"Error occurred: {e}")
        return []
    finally:
        db.close()


#####################################
# store_role
# Params: role_data: dict
#         role_discord_id: str
#         role_name: str
#         role_description: str
# Stores a new role in the database
#####################################
def store_role(role_data: dict) -> Optional[Role]:
    db: DBSession = SessionLocal()
    try:
        role = Role(
            role_discord_id = role_data.get('role_discord_id'),
            role_name = role_data.get('role_name'),
            role_description = role_data.get('role_description')
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        return role
    except IntegrityError as e:
        # this is SQLAchemy's way of handling unique constraints
        db.rollback()
        print(f"Integrity error storing role: {e.orig}")
        return None
    except Exception as e:
        db.rollback()
        print(f"Error storing role: {e}")
        return None
    finally:
        db.close()

######################################
# delete_role
# Params: role_id: int
# Deletes a role from the database by its ID
#####################################
def delete_role(role_id: int) -> bool:
    db: DBSession = SessionLocal()
    try:
        role = db.query(Role).filter(Role.role_id == role_id).first()
        if role:
            db.delete(role)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"Error deleting role: {e}")
        return False
    finally:
        db.close()

######################################
# update_role
# Params: role_id: int, role_data: dict
# Updates an existing role in the database
#####################################
def update_role(role_id: int, role_data: dict) -> Optional[Role]:
    db: DBSession = SessionLocal()
    try:
        role = db.query(Role).filter(Role.role_id == role_id).first()
        if role:
            for key, value in role_data.items():
                setattr(role, key, value)
            db.commit()
            db.refresh(role)
            return role
        return None
    except Exception as e:
        db.rollback()
        print(f"Error updating role: {e}")
        return None
    finally:
        db.close()

######################################
# role_exists
# Params: role_name: str
# Returns: bool
# Checks if a role exists in the database by its name
######################################
def role_exists(role_name: str) -> bool:
    db: DBSession = SessionLocal()
    try:
        role = db.query(Role).filter(Role.role_name == role_name).first()
        return role is not None
    except Exception as e:
        print(f"Error occurred: {e}")
        return False
    finally:
        db.close()
