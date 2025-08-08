from sqlalchemy.orm import Session as DBSession
from sqlalchemy.exc import IntegrityError
from typing import Optional
from datetime import datetime, timedelta

from ..models.permission import Permission
from ..connection import SessionLocal

####################################
# getPermissionIdByName
# Params: permission_name: str
# Give it a permission name and it returns the permission id if it exists
####################################
def getPermissionIdByName(permission_name: str) -> Optional[int]:
    db: DBSession = SessionLocal()
    try:
        permission = db.querry(Permission).filter(Permission.permission_name == permission_name).first()
        return permission.permission_id if permission else None
    except Exception as e:
        db.rollback()
        print(f"Error getting Permission by name: {e}")
        return None
    finally:
        db.close()

#####################################
# getPermissionById
# Params: permission_id: int
# Returns a permission when given a permission id
#####################################
def getPermissionById(permission_id: int) -> Optional[Permission]:
    db: DBSession = SessionLocal()
    try:
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        return permission
    except Exception as e:
        db.rollback()
        print(f"Error getting Permission by id: {e}")
        return None
    finally:
        db.close()

#####################################
# getPermissionByName
# Params: permission_name: str
# Returns a Permission when given a permission name
#####################################
def getPermissionByName(permission_name: str) -> Optional[Permission]:
    db: DBSession = SessionLocal()
    try:
        permission = db.query(Permission).filter(Permission.permission_name == permission_name).first()
        return permission if permission else None
    except Exception as e:
        db.rollback()
        print(f"Error getting Permission by name: {e}")
        return None
    finally:
        db.close()


#####################################
# getAllPermissions
# Get all the Permissions from the db
#####################################
def getAllPermissions() -> list[Permission]:
    db: DBSession = SessionLocal()
    try:
        permissions = db.query(Permission).all()
        return permissions
    except Exception as e:
        print(f"Error getting all Permissions: {e}")
        return None
    finally:
        db.close()

#####################################
# store_permission
# Params: permission_data: dict
#         permission_name: str
#         permission_description: str
# Stores a new permission in the database.
# Note: permission_data is the dictionary containing permission details.
#####################################
def store_permission(permission_data: dict) -> Optional[Permission]:
    
    # create db session
    db: DBSession = SessionLocal()

    try:
        permission = Permission(
            permission_name = permission_data.get('permission_name'),
            permission_description = permission_data.get('permission_description')
        )
        db.add(permission)
        db.commit()
        db.refresh(permission)
        return permission
    except IntegrityError as e:
        db.rollback()
        print(f"Integrity error storing permission: {e.orig}")
        return None
    except Exception as e:
        db.rollback
        print(f"Error storing persmission: {e}")

    finally:
        db.close()

####################################
# delete_permission_by_id
# Params: permission_id: int
# Deletes the Permission that matches the given permission id
####################################
def delete_permission_by_id(permission_id: int) -> bool:
    db: DBSession = SessionLocal()
    try:
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        if permission:
            db.delete(permission)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"Error deleting Permission by id: {e}")
        return None
    finally:
        db.close()

######################################
# update_permission
# Params: permission_id: int, permission_data: dict
# Updates an existing permission in the database
#####################################
def update_permission(permission_id: int, permission_data: dict) -> Optional[Permission]:
    db: DBSession = SessionLocal()
    try:
        permission = db.query(Permission).filter(Permission.permission_id == permission_id).first()
        if permission:
            for key, value in permission_data.items():
                setattr(permission, key, value)
            db.commit()
            db.refresh(permission)
            return permission
        return None
    except Exception as e:
        db.rollback()
        print(f"Error updating Permission: {e}")
        return None
    finally:
        db.close()

######################################
# permission_exists
# Params: permission_name: str
# Returns: bool
# Checks if a permission exists in the database by its name
######################################
def permission_exists(permission_name: str) -> bool:
    db: DBSession = SessionLocal()
    try:
        permission = db.query(Permission).filter(Permission.permission_name == permission_name).first()
        return permission is not None
    except Exception as e:
        print(f"Error occurred: {e}")
        return False
    finally:
        db.close()