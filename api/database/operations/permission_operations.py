from sqlalchemy.orm import Session as DBSession
from sqlalchemy.exc import IntegrityError
from typing import Optional
from datetime import datetime, timedelta

from ..models.permission import Permission
from ..connection import SessionLocal

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