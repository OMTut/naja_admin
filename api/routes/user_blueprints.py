"""
Personal blueprint routes — any approved user managing their own collection.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database.connection import get_db
from database.models.blueprint import Blueprint, UserBlueprint
from database.models.user import User
from dependencies.auth import require_session

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserBlueprintResponse(BaseModel):
    uuid:             str
    key:              Optional[str]
    category_uuid:    Optional[str]
    category_label:   Optional[str]
    output_name:      Optional[str]
    output_class:     Optional[str]
    craft_time_label: Optional[str]
    ingredient_count: Optional[int]
    added_at:         str

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[UserBlueprintResponse])
async def get_my_blueprints(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    rows = (
        db.query(Blueprint, UserBlueprint)
        .join(UserBlueprint, Blueprint.uuid == UserBlueprint.blueprint_uuid)
        .filter(UserBlueprint.user_id == current_user.id)
        .order_by(Blueprint.output_name)
        .all()
    )

    return [
        UserBlueprintResponse(
            uuid             = bp.uuid,
            key              = bp.key,
            category_uuid    = bp.category_uuid,
            category_label   = bp.category.label if bp.category else None,
            output_name      = bp.output_name,
            output_class     = bp.output_class,
            craft_time_label = bp.craft_time_label,
            ingredient_count = bp.ingredient_count,
            added_at         = ub.created_at.isoformat(),
        )
        for bp, ub in rows
    ]


@router.post("/{blueprint_uuid}", status_code=201)
async def add_my_blueprint(
    blueprint_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if not db.get(Blueprint, blueprint_uuid):
        raise HTTPException(status_code=404, detail="Blueprint not found")

    try:
        db.add(UserBlueprint(user_id=current_user.id, blueprint_uuid=blueprint_uuid))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Blueprint already in your collection")

    return {"success": True}


@router.delete("/{blueprint_uuid}")
async def remove_my_blueprint(
    blueprint_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    row = (
        db.query(UserBlueprint)
        .filter(
            UserBlueprint.user_id == current_user.id,
            UserBlueprint.blueprint_uuid == blueprint_uuid,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Blueprint not in your collection")

    db.delete(row)
    db.commit()
    return {"success": True}
