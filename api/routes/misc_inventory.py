"""
Miscellaneous inventory routes.

Catalog (admin-only write):
  GET/POST   /api/inventory/misc/catalog
  PATCH/DELETE /api/inventory/misc/catalog/{id}

Holdings (all authenticated members):
  GET/POST   /api/inventory/misc/
  POST       /api/inventory/misc/{id}/transfer
  POST       /api/inventory/misc/{id}/consume
  GET        /api/inventory/misc/{id}/events
  DELETE     /api/inventory/misc/{id}   — added_by or admin

Categories:
  GET/POST   /api/inventory/misc/categories

Members list (for transfer UI):
  GET        /api/inventory/misc/members
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models.misc_inventory import InventoryCatalog, MiscCategory, MiscInventory, MiscInventoryEvent
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


def _category_display(cat: Optional[MiscCategory]) -> Optional[dict]:
    if not cat:
        return None
    return {
        "id":         cat.id,
        "name":       cat.name,
        "item_count": len(cat.catalog_items),
        "created_at": cat.created_at,
    }


def _get_inventory_manager_ids(db: Session) -> set[int]:
    """Return the set of user IDs that hold the inventory permission."""
    rows = db.execute(text("""
        SELECT DISTINCT ur.user_id
        FROM users_roles ur
        JOIN roles_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE p.permission_name = 'inventory'
    """)).fetchall()
    return {row[0] for row in rows}


def _catalog_response(cat: InventoryCatalog) -> dict:
    active = [h for h in cat.holdings if h.status != "depleted"]
    return {
        "id":             cat.id,
        "display_name":   cat.display_name,
        "category":       _category_display(cat.category_obj),
        "total_quantity": sum(h.quantity for h in active),
        "holder_count":   len({h.held_by for h in active if h.held_by}),
        "created_at":     cat.created_at,
    }


def _holding_response(item: MiscInventory) -> dict:
    return {
        "id":              item.id,
        "catalog_item_id": item.catalog_item_id,
        "display_name":    item.catalog_item.display_name if item.catalog_item else None,
        "category":        _category_display(item.catalog_item.category_obj) if item.catalog_item else None,
        "location":        item.location,
        "quantity":        item.quantity,
        "status":          item.status,
        "held_by":         _user_display(item.held_by_user),
        "added_by":        _user_display(item.added_by_user),
        "created_at":      item.created_at,
        "updated_at":      item.updated_at,
    }


def _event_response(ev: MiscInventoryEvent) -> dict:
    return {
        "id":           ev.id,
        "item_id":      ev.item_id,
        "event_type":   ev.event_type,
        "quantity":     ev.quantity,
        "from_user":    _user_display(ev.from_user),
        "to_user":      _user_display(ev.to_user),
        "performed_by": _user_display(ev.performed_by),
        "created_at":   ev.created_at,
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str


class CatalogItemCreate(BaseModel):
    display_name: str
    category_id:  Optional[int] = None


class CatalogItemUpdate(BaseModel):
    display_name: Optional[str] = None
    category_id:  Optional[int] = None


class HoldingCreate(BaseModel):
    catalog_item_id: int
    location:        Optional[str] = None
    quantity:        int = 1
    held_by:         Optional[int] = None
    added_by:        Optional[int] = None


class HoldingUpdateLocation(BaseModel):
    location: Optional[str] = None


class TransferBody(BaseModel):
    to_user_id: int
    quantity:   int


class ConsumeBody(BaseModel):
    quantity: int


# ── Category routes ───────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories(
    db: Session = Depends(get_db),
    _: User = Depends(require_session),
):
    cats = db.query(MiscCategory).order_by(MiscCategory.name).all()
    return [_category_display(c) for c in cats]


@router.post("/categories", status_code=201)
async def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_session),
):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty.")
    existing = db.query(MiscCategory).filter(MiscCategory.name.ilike(name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists.")
    cat = MiscCategory(name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _category_display(cat)


@router.patch("/categories/{category_id}")
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only.")
    cat = db.get(MiscCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty.")
    existing = db.query(MiscCategory).filter(
        MiscCategory.name.ilike(name), MiscCategory.id != category_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category name already exists.")
    cat.name = name
    db.commit()
    db.refresh(cat)
    return _category_display(cat)


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only.")
    cat = db.get(MiscCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(cat)
    db.commit()


# ── Catalog routes (admin write) ──────────────────────────────────────────────

@router.get("/catalog")
async def list_catalog(
    db: Session = Depends(get_db),
    _: User = Depends(require_session),
):
    items = db.query(InventoryCatalog).order_by(InventoryCatalog.display_name).all()
    return [_catalog_response(c) for c in items]


@router.post("/catalog", status_code=201)
async def create_catalog_item(
    body: CatalogItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only.")
    display_name = body.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail="Display name cannot be empty.")
    item = InventoryCatalog(
        display_name = display_name,
        category_id  = body.category_id,
        created_by   = current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _catalog_response(item)


@router.patch("/catalog/{catalog_id}")
async def update_catalog_item(
    catalog_id: int,
    body: CatalogItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only.")
    item = db.get(InventoryCatalog, catalog_id)
    if not item:
        raise HTTPException(status_code=404, detail="Catalog item not found.")
    if body.display_name is not None: item.display_name = body.display_name.strip()
    if body.category_id  is not None: item.category_id  = body.category_id
    db.commit()
    db.refresh(item)
    return _catalog_response(item)


@router.delete("/catalog/{catalog_id}", status_code=204)
async def delete_catalog_item(
    catalog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only.")
    item = db.get(InventoryCatalog, catalog_id)
    if not item:
        raise HTTPException(status_code=404, detail="Catalog item not found.")
    if item.holdings:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete: this item has active holdings. Remove all holdings first.",
        )
    db.delete(item)
    db.commit()


# ── Members list (for transfer UI) ────────────────────────────────────────────

@router.get("/members")
async def list_members(
    db: Session = Depends(get_db),
    _: User = Depends(require_session),
):
    members = db.query(User).order_by(User.discord_username).all()
    return [_user_display(u) for u in members]


# ── Holding routes ────────────────────────────────────────────────────────────

@router.get("")
async def list_holdings(
    db: Session = Depends(get_db),
    _: User = Depends(require_session),
):
    holdings = (
        db.query(MiscInventory)
        .order_by(MiscInventory.created_at.desc())
        .all()
    )
    return [_holding_response(h) for h in holdings]


@router.post("", status_code=201)
async def add_holding(
    body: HoldingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    if body.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1.")
    catalog_item = db.get(InventoryCatalog, body.catalog_item_id)
    if not catalog_item:
        raise HTTPException(status_code=404, detail="Catalog item not found.")

    held_by  = body.held_by  if body.held_by  is not None else current_user.id
    added_by = body.added_by if body.added_by is not None else current_user.id
    holding = MiscInventory(
        catalog_item_id = body.catalog_item_id,
        location        = body.location,
        quantity        = body.quantity,
        status          = "active",
        held_by         = held_by,
        added_by        = added_by,
    )
    db.add(holding)
    db.flush()

    event = MiscInventoryEvent(
        item_id         = holding.id,
        event_type      = "added",
        quantity        = body.quantity,
        to_user_id      = held_by,
        performed_by_id = current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(holding)
    return _holding_response(holding)


@router.patch("/{holding_id}")
async def update_holding_location(
    holding_id: int,
    body: HoldingUpdateLocation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    holding = db.get(MiscInventory, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found.")
    if holding.held_by != current_user.id and not check_user_has_permission(current_user.id, "inventory"):
        raise HTTPException(status_code=403, detail="Insufficient permissions.")
    if body.location is not None:
        holding.location    = body.location
        holding.updated_at  = datetime.now(timezone.utc)
        db.commit()
        db.refresh(holding)
    return _holding_response(holding)


@router.post("/{holding_id}/transfer")
async def transfer_holding(
    holding_id: int,
    body: TransferBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    holding = db.get(MiscInventory, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found.")
    if holding.held_by != current_user.id and not check_user_has_permission(current_user.id, "inventory"):
        raise HTTPException(status_code=403, detail="Only the current holder or an inventory manager can transfer.")
    if body.quantity < 1 or body.quantity > holding.quantity:
        raise HTTPException(status_code=400, detail=f"Quantity must be between 1 and {holding.quantity}.")
    if not db.get(User, body.to_user_id):
        raise HTTPException(status_code=404, detail="Target user not found.")

    from_user_id    = holding.held_by
    holding.held_by = body.to_user_id
    holding.updated_at = datetime.now(timezone.utc)

    db.add(MiscInventoryEvent(
        item_id         = holding.id,
        event_type      = "transferred",
        quantity        = body.quantity,
        from_user_id    = from_user_id,
        to_user_id      = body.to_user_id,
        performed_by_id = current_user.id,
    ))
    db.commit()
    db.refresh(holding)
    return _holding_response(holding)


@router.post("/{holding_id}/consume")
async def consume_holding(
    holding_id: int,
    body: ConsumeBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    holding = db.get(MiscInventory, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found.")
    if holding.held_by != current_user.id and not check_user_has_permission(current_user.id, "inventory"):
        raise HTTPException(status_code=403, detail="Only the current holder or an inventory manager can consume.")
    if body.quantity < 1 or body.quantity > holding.quantity:
        raise HTTPException(status_code=400, detail=f"Quantity must be between 1 and {holding.quantity}.")

    holding.quantity   -= body.quantity
    holding.status      = "depleted" if holding.quantity == 0 else "active"
    holding.updated_at  = datetime.now(timezone.utc)

    db.add(MiscInventoryEvent(
        item_id         = holding.id,
        event_type      = "consumed",
        quantity        = body.quantity,
        from_user_id    = holding.held_by,
        performed_by_id = current_user.id,
    ))
    db.commit()
    db.refresh(holding)
    return _holding_response(holding)


@router.get("/{holding_id}/events")
async def get_holding_events(
    holding_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_session),
):
    holding = db.get(MiscInventory, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found.")
    return [_event_response(ev) for ev in holding.events]


@router.delete("/{holding_id}", status_code=204)
async def delete_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_session),
):
    holding = db.get(MiscInventory, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found.")
    if holding.held_by != current_user.id and not check_user_has_permission(current_user.id, "inventory"):
        raise HTTPException(status_code=403, detail="Insufficient permissions.")
    db.delete(holding)
    db.commit()
