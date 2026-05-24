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
from dependencies.auth import require_session

router = APIRouter()


# Pydantic models for request/response
class RoleCreate(BaseModel):
    role_discord_id: Optional[str] = None
    role_name: str
    role_description: Optional[str] = None
    grants_access: bool = False


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    role_description: Optional[str] = None
    grants_access: Optional[bool] = None


class RoleResponse(BaseModel):
    role_id: int
    role_discord_id: str
    role_name: str
    role_description: Optional[str]
    grants_access: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Role administration endpoints
@router.get("/", response_model=List[RoleResponse])
async def get_all_roles(db: Session = Depends(get_db), _=Depends(require_session)):
    """Get all roles"""
    roles = db.query(Role).all()
    return roles


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    """Get a specific role by ID"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.post("/", response_model=RoleResponse, status_code=201)
async def create_role(role_data: RoleCreate, db: Session = Depends(get_db), _=Depends(require_session)):
    """Create a new role"""
    # Check if discord_id or name already exists
    existing = db.query(Role).filter(
        (Role.role_discord_id == role_data.role_discord_id) |
        (Role.role_name == role_data.role_name)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Role with this Discord ID or name already exists"
        )
    
    new_role = Role(
        role_discord_id=role_data.role_discord_id or f"app-{uuid.uuid4().hex[:16]}",
        role_name=role_data.role_name,
        role_description=role_data.role_description,
        grants_access=role_data.grants_access
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(role_id: int, role_data: RoleUpdate, db: Session = Depends(get_db), _=Depends(require_session)):
    """Update an existing role"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check for name conflicts if updating name
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
    
    if role_data.grants_access is not None:
        role.grants_access = role_data.grants_access
    
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}")
async def delete_role(role_id: int, db: Session = Depends(get_db), _=Depends(require_session)):
    """Delete a role"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    remove_role_from_all_users(role_id)
    db.delete(role)
    db.commit()
    return {"success": True, "message": f"Role {role_id} deleted successfully"}
