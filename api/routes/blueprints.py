"""
Blueprint catalog routes (admin)
"""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models.blueprint import Blueprint, BlueprintIngredient, ItemCategory, UserBlueprint
from database.models.user import User
from dependencies.auth import require_session, require_roles

ADMIN_ROLES = ("Role 1", "App Admin")
from services.blueprint_sync import sync_blueprints

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CategoryResponse(BaseModel):
    uuid:       str
    record_key: Optional[str]
    label:      str
    sort_order: Optional[int]

    class Config:
        from_attributes = True


class BlueprintSummaryResponse(BaseModel):
    uuid:               str
    key:                Optional[str]
    category_uuid:      Optional[str]
    category_label:     Optional[str]
    output_name:        Optional[str]
    output_class:       Optional[str]
    craft_time_label:   Optional[str]
    ingredient_count:   Optional[int]

    class Config:
        from_attributes = True


class OwnerResponse(BaseModel):
    user_id:          int
    discord_username: str
    global_name:      Optional[str]
    server_nickname:  Optional[str]


class BlueprintDetailResponse(BlueprintSummaryResponse):
    craft_time_seconds: Optional[int]
    owners:             List[OwnerResponse]
    ingredients:        Optional[list] = None


class OrgBlueprintResponse(BlueprintSummaryResponse):
    owner_count: int
    owners:      List[OwnerResponse]


# ── Routes ────────────────────────────────────────────────────────────────────

# Declared before /{uuid} to avoid route shadowing
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db), _=Depends(require_session)):
    excluded = {'Example1', 'Example2', 'DismantleExample1', 'RefiningExample1', 'Medical', 'MissionItem', 'FuseBattery'}
    return (
        db.query(ItemCategory)
        .filter(~ItemCategory.record_key.in_(excluded))
        .order_by(ItemCategory.sort_order)
        .all()
    )


@router.get("/org", response_model=List[OrgBlueprintResponse], dependencies=[Depends(require_roles(*ADMIN_ROLES))])
async def get_org_blueprints(db: Session = Depends(get_db), _=Depends(require_session)):
    """All blueprints owned by at least one org member, with owner list."""
    rows = (
        db.query(Blueprint, User, UserBlueprint)
        .join(UserBlueprint, Blueprint.uuid == UserBlueprint.blueprint_uuid)
        .join(User, UserBlueprint.user_id == User.id)
        .order_by(Blueprint.output_name, User.discord_username)
        .all()
    )

    # Group by blueprint
    grouped: dict = {}
    for bp, user, _ in rows:
        if bp.uuid not in grouped:
            grouped[bp.uuid] = {
                "blueprint": bp,
                "owners": [],
            }
        grouped[bp.uuid]["owners"].append(OwnerResponse(
            user_id          = user.id,
            discord_username = user.discord_username,
            global_name      = user.global_name,
            server_nickname  = user.server_nickname,
        ))

    results = []
    for entry in grouped.values():
        bp = entry["blueprint"]
        owners = entry["owners"]
        results.append(OrgBlueprintResponse(
            uuid               = bp.uuid,
            key                = bp.key,
            category_uuid      = bp.category_uuid,
            category_label     = bp.category.label if bp.category else None,
            output_name        = bp.output_name,
            output_class       = bp.output_class,
            craft_time_label   = bp.craft_time_label,
            ingredient_count   = bp.ingredient_count,
            owner_count        = len(owners),
            owners             = owners,
        ))
    return results


@router.post("/sync", dependencies=[Depends(require_roles(*ADMIN_ROLES))])
async def trigger_sync(db: Session = Depends(get_db), _=Depends(require_session)):
    """Pull latest blueprint catalog from SC_Data."""
    try:
        result = sync_blueprints(db)
        return {"success": True, "result": result}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"SC_Data unreachable: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {e}")


@router.get("/", response_model=List[BlueprintSummaryResponse])
async def get_blueprints(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_session),
):
    query = db.query(Blueprint)
    if category:
        query = query.filter(Blueprint.category_uuid == category)
    blueprints = query.order_by(Blueprint.output_name).all()

    return [
        BlueprintSummaryResponse(
            uuid             = bp.uuid,
            key              = bp.key,
            category_uuid    = bp.category_uuid,
            category_label   = bp.category.label if bp.category else None,
            output_name      = bp.output_name,
            output_class     = bp.output_class,
            craft_time_label = bp.craft_time_label,
            ingredient_count = bp.ingredient_count,
        )
        for bp in blueprints
    ]


@router.get("/{uuid}", response_model=BlueprintDetailResponse)
async def get_blueprint(uuid: str, db: Session = Depends(get_db), _=Depends(require_session)):
    bp = db.get(Blueprint, uuid)
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    owners = (
        db.query(User)
        .join(UserBlueprint, User.id == UserBlueprint.user_id)
        .filter(UserBlueprint.blueprint_uuid == uuid)
        .all()
    )

    ingredients = (
        db.query(BlueprintIngredient)
        .filter(BlueprintIngredient.blueprint_uuid == uuid)
        .all()
    )

    return BlueprintDetailResponse(
        uuid               = bp.uuid,
        key                = bp.key,
        category_uuid      = bp.category_uuid,
        category_label     = bp.category.label if bp.category else None,
        output_name        = bp.output_name,
        output_class       = bp.output_class,
        craft_time_label   = bp.craft_time_label,
        craft_time_seconds = bp.craft_time_seconds,
        ingredient_count   = bp.ingredient_count,
        owners             = [
            OwnerResponse(
                user_id          = u.id,
                discord_username = u.discord_username,
                global_name      = u.global_name,
                server_nickname  = u.server_nickname,
            )
            for u in owners
        ],
        ingredients = [
            {
                "name":               ing.name,
                "kind":               ing.kind,
                "resource_type_uuid": ing.resource_type_uuid,
                "item_uuid":          ing.item_uuid,
                "quantity_scu":       ing.quantity_scu,
                "quantity":           ing.quantity,
            }
            for ing in ingredients
        ] or None,
    )
