"""
Permission administration routes
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from database.operations.permission_operations import (
    get_all_permissions,
    create_permission,
    update_permission,
    delete_permission,
)
from dependencies.auth import require_session, require_permission

router = APIRouter(dependencies=[Depends(require_permission("admin"))])


class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PermissionUpdate(BaseModel):
    description: Optional[str] = None


class PermissionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]


@router.get("", response_model=List[PermissionResponse])
async def get_permissions(_=Depends(require_session)):
    return get_all_permissions()


@router.post("", response_model=PermissionResponse, status_code=201)
async def create_perm(data: PermissionCreate, _=Depends(require_session)):
    result = create_permission(data.name.strip(), data.description)
    if result is None:
        raise HTTPException(status_code=400, detail="Permission already exists or could not be created")
    return result


@router.patch("/{permission_id}", response_model=PermissionResponse)
async def update_perm(permission_id: int, data: PermissionUpdate, _=Depends(require_session)):
    result = update_permission(permission_id, description=data.description)
    if result is None:
        raise HTTPException(status_code=404, detail="Permission not found")
    return result


@router.delete("/{permission_id}")
async def delete_perm(permission_id: int, _=Depends(require_session)):
    if not delete_permission(permission_id):
        raise HTTPException(status_code=404, detail="Permission not found")
    return {"success": True}
