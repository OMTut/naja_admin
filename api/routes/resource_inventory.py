"""
Resource inventory routes.
All org members can view and add entries.
Only the entry owner (added_by) or an admin can edit or delete.
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models.inventory import ResourceInventory
from database.models.user import User
from dependencies.auth import require_session
from services.role_access import check_user_has_permission


router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_admin(user: User) -> bool:
    return check_user_has_permission(user.id, "admin")


def _user_display(user: Optional[User]) -> Optional[dict]:
    if not user:
        return None
    return {
        "id":               user.id,
        "discord_username": user.discord_username,
        "global_name":      user.global_name,
        "server_nickname":  user.server_nickname,
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class ResourceInventoryCreate(BaseModel):
    ore_name:     str
    quality:      int
    original_scu: float
    location:     str
    held_by:      Optional[int] = None   # defaults to added_by if omitted


class ResourceInventoryUpdate(BaseModel):
    ore_name:    Optional[str]   = None
    quality:     Optional[int]   = None
    current_scu: Optional[float] = None
    location:    Optional[str]   = None
    held_by:     Optional[int]   = None


class ResourceInventoryResponse(BaseModel):
    id:           int
    ore_name:     str
    quality:      Optional[int]
    original_scu: float
    current_scu:  float
    location:     Optional[str]
    held_by:      Optional[dict]
    added_by:     Optional[dict]
    created_at:   datetime
    updated_at:   datetime

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ResourceInventoryResponse])
async def list_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    entries = (
        db.query(ResourceInventory)
        .order_by(ResourceInventory.ore_name, ResourceInventory.created_at.desc())
        .all()
    )
    return [
        ResourceInventoryResponse(
            id           = e.id,
            ore_name     = e.ore_name,
            quality      = e.quality,
            original_scu = float(e.original_scu),
            current_scu  = float(e.current_scu),
            location     = e.location,
            held_by      = _user_display(e.held_by_user),
            added_by     = _user_display(e.added_by_user),
            created_at   = e.created_at,
            updated_at   = e.updated_at,
        )
        for e in entries
    ]


@router.post("", response_model=ResourceInventoryResponse, status_code=201)
async def add_resource(
    body: ResourceInventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    held_by = body.held_by if body.held_by is not None else current_user.id
    entry = ResourceInventory(
        ore_name     = body.ore_name,
        quality      = body.quality,
        original_scu = body.original_scu,
        current_scu  = body.original_scu,
        location     = body.location,
        held_by      = held_by,
        added_by     = current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return ResourceInventoryResponse(
        id           = entry.id,
        ore_name     = entry.ore_name,
        quality      = entry.quality,
        original_scu = float(entry.original_scu),
        current_scu  = float(entry.current_scu),
        location     = entry.location,
        held_by      = _user_display(entry.held_by_user),
        added_by     = _user_display(entry.added_by_user),
        created_at   = entry.created_at,
        updated_at   = entry.updated_at,
    )


@router.patch("/{entry_id}", response_model=ResourceInventoryResponse)
async def update_resource(
    entry_id: int,
    body: ResourceInventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    entry = db.get(ResourceInventory, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.added_by != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if body.ore_name    is not None: entry.ore_name    = body.ore_name
    if body.quality     is not None: entry.quality     = body.quality
    if body.current_scu is not None: entry.current_scu = body.current_scu
    if body.location    is not None: entry.location    = body.location
    if body.held_by     is not None: entry.held_by     = body.held_by
    entry.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(entry)

    return ResourceInventoryResponse(
        id           = entry.id,
        ore_name     = entry.ore_name,
        quality      = entry.quality,
        original_scu = float(entry.original_scu),
        current_scu  = float(entry.current_scu),
        location     = entry.location,
        held_by      = _user_display(entry.held_by_user),
        added_by     = _user_display(entry.added_by_user),
        created_at   = entry.created_at,
        updated_at   = entry.updated_at,
    )


@router.delete("/{entry_id}", status_code=204)
async def delete_resource(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    entry = db.get(ResourceInventory, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.added_by != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db.delete(entry)
    db.commit()
