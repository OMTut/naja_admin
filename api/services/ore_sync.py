"""
Syncs ore catalog from SC_Data into Naja's local database.
"""
import os
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from database.models.ore import Ore

SC_DATA_URL = os.getenv("SC_DATA_URL", "http://localhost:8004")


def sync_ores(db: Session) -> dict:
    ores_added = ores_updated = 0

    with httpx.Client(timeout=60.0) as client:
        res = client.get(f"{SC_DATA_URL}/ores/")
        res.raise_for_status()

    now = datetime.now(timezone.utc)
    seen: set = set()
    for item in res.json():
        display_name = item.get("display_name")
        if not display_name or display_name in seen:
            continue
        seen.add(display_name)

        existing = db.query(Ore).filter(Ore.display_name == display_name).first()
        if existing:
            existing.type      = item.get("type")
            existing.synced_at = now
            ores_updated += 1
        else:
            db.add(Ore(
                display_name = display_name,
                type         = item.get("type"),
                synced_at    = now,
            ))
            ores_added += 1

    # Remove ores no longer present in SC_Data
    ores_removed = (
        db.query(Ore)
        .filter(~Ore.display_name.in_(seen))
        .delete(synchronize_session=False)
    )

    db.commit()

    return {
        "ores": {"added": ores_added, "updated": ores_updated, "removed": ores_removed},
    }
