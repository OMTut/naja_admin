"""
Role administration routes
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from database.connection import get_db
from database.models.role import Role
from database.operations.users_roles import remove_role_from_all_users
from database.operations.permission_operations import get_role_permissions, set_role_permissions
from dependencies.auth import require_session, require_permission

router = APIRouter(dependencies=[Depends(require_permission("admin"))])


class RoleCreate(BaseModel):
    role_discord_id: Optional[str] = None
    role_name: str
    role_description: Optional[str] = None
    permissions: List[str] = []


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    role_description: Optional[str] = None
    permissions: Optional[List[str]] = None


class RoleResponse(BaseModel):
    role_id: int
    role_discord_id: str
    role_name: str
    role_description: Optional[str]
    permissions: List[str]
    created_at: datetime
    updated_at: datetime


def _role_dict(role: Role) -> dict:
    return {
        "role_id":          role.role_id,
        "role_discord_id":  role.role_discord_id,
        "role_name":        role.role_name,
        "role_description": role.role_description,
        "permissions":      get_role_permissions(role.role_id),
        "created_at":       role.created_at,
        "updated_at":       role.updated_at,
    }


@router.get("", response_model=List[RoleResponse])
async def get_all_roles(db: Session = Depends(get_db), _=Depends(require_session)):
    roles = db.query(Role).all()
    return [_role_dict(r) for r in roles]


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return _role_dict(role)


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role(role_data: RoleCreate, db: Session = Depends(get_db), _=Depends(require_session)):
    existing = db.query(Role).filter(
        (Role.role_discord_id == role_data.role_discord_id) |
        (Role.role_name == role_data.role_name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role with this Discord ID or name already exists")

    new_role = Role(
        role_discord_id=role_data.role_discord_id or f"app-{uuid.uuid4().hex[:16]}",
        role_name=role_data.role_name,
        role_description=role_data.role_description,
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    if role_data.permissions:
        set_role_permissions(new_role.role_id, role_data.permissions)

    return _role_dict(new_role)


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(role_id: int, role_data: RoleUpdate, db: Session = Depends(get_db), _=Depends(require_session)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role_data.role_name is not None:
        existing = db.query(Role).filter(
            Role.role_name == role_data.role_name,
            Role.role_id != role_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Role name already exists")
        role.role_name = role_data.role_name

    if role_data.role_description is not None:
        role.role_description = role_data.role_description

    db.commit()
    db.refresh(role)

    if role_data.permissions is not None:
        set_role_permissions(role_id, role_data.permissions)

    return _role_dict(role)


@router.delete("/{role_id}")
async def delete_role(role_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    remove_role_from_all_users(role_id)
    db.delete(role)
    db.commit()
    return {"success": True, "message": f"Role {role_id} deleted successfully"}
