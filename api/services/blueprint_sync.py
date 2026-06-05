"""
Syncs blueprint catalog (including ingredients) from SC_Data into Naja's local database.
"""
import os
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from database.models.blueprint import Blueprint, BlueprintIngredient, ItemCategory

SC_DATA_URL = os.getenv("SC_DATA_URL", "http://localhost:8004")


def sync_blueprints(db: Session) -> dict:
    categories_added = categories_updated = 0
    blueprints_added = blueprints_updated = 0
    ingredients_synced = 0

    with httpx.Client(timeout=60.0) as client:
        cat_res = client.get(f"{SC_DATA_URL}/blueprints/categories")
        cat_res.raise_for_status()
        bp_res = client.get(f"{SC_DATA_URL}/blueprints/full")
        bp_res.raise_for_status()

    for cat in cat_res.json():
        existing = db.get(ItemCategory, cat["uuid"])
        if existing:
            existing.record_key = cat["record_key"]
            existing.label      = cat["label"]
            existing.sort_order = cat["sort_order"]
            categories_updated += 1
        else:
            db.add(ItemCategory(
                uuid       = cat["uuid"],
                record_key = cat["record_key"],
                label      = cat["label"],
                sort_order = cat["sort_order"],
            ))
            categories_added += 1

    db.flush()

    now = datetime.now(timezone.utc)
    for bp in bp_res.json():
        existing = db.get(Blueprint, bp["uuid"])
        if existing:
            existing.key                = bp["key"]
            existing.category_uuid      = bp["category_uuid"]
            existing.output_item_uuid   = bp["output_item_uuid"]
            existing.output_name        = bp["output_name"]
            existing.output_class       = bp["output_class"]
            existing.craft_time_seconds = bp["craft_time_seconds"]
            existing.craft_time_label   = bp["craft_time_label"]
            existing.ingredient_count   = bp["ingredient_count"]
            existing.synced_at          = now
            blueprints_updated += 1
        else:
            db.add(Blueprint(
                uuid               = bp["uuid"],
                key                = bp["key"],
                category_uuid      = bp["category_uuid"],
                output_item_uuid   = bp["output_item_uuid"],
                output_name        = bp["output_name"],
                output_class       = bp["output_class"],
                craft_time_seconds = bp["craft_time_seconds"],
                craft_time_label   = bp["craft_time_label"],
                ingredient_count   = bp["ingredient_count"],
                synced_at          = now,
            ))
            blueprints_added += 1

        # Replace ingredients for this blueprint
        db.query(BlueprintIngredient).filter(
            BlueprintIngredient.blueprint_uuid == bp["uuid"]
        ).delete(synchronize_session=False)

        for ing in bp.get("ingredients", []):
            db.add(BlueprintIngredient(
                blueprint_uuid     = bp["uuid"],
                name               = ing["name"],
                kind               = ing.get("kind"),
                resource_type_uuid = ing.get("resource_type_uuid"),
                item_uuid          = ing.get("item_uuid"),
                quantity_scu       = ing.get("quantity_scu"),
                quantity           = ing.get("quantity"),
            ))
            ingredients_synced += 1

    db.commit()

    return {
        "categories":  {"added": categories_added,  "updated": categories_updated},
        "blueprints":  {"added": blueprints_added,   "updated": blueprints_updated},
        "ingredients": {"synced": ingredients_synced},
    }
