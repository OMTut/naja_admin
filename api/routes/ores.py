"""
Ore catalog routes (admin)
"""
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models.ore import Ore
from dependencies.auth import require_session, require_permission
from services.ore_sync import sync_ores


router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class OreResponse(BaseModel):
    id:           int
    display_name: str
    type:         Optional[str]

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[OreResponse])
async def get_ores(db: Session = Depends(get_db), _=Depends(require_session)):
    return db.query(Ore).order_by(Ore.display_name).all()


@router.post("/sync", dependencies=[Depends(require_permission("admin"))])
async def trigger_sync(db: Session = Depends(get_db), _=Depends(require_session)):
    """Pull latest ore catalog from SC_Data."""
    try:
        result = sync_ores(db)
        return {"success": True, "result": result}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"SC_Data unreachable: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {e}")
