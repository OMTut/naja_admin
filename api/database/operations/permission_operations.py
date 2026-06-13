from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from typing import Optional
from ..connection import SessionLocal


def get_all_permissions() -> list[dict]:
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT permission_id, permission_name, permission_description
            FROM permissions
            ORDER BY permission_name
        """)).fetchall()
        return [{"id": r[0], "name": r[1], "description": r[2]} for r in rows]
    except Exception as e:
        print(f"Error getting permissions: {e}")
        return []
    finally:
        db.close()


def get_role_permissions(role_id: int) -> list[str]:
    """Return permission names assigned to a role."""
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT p.permission_name
            FROM permissions p
            JOIN roles_permissions rp ON p.permission_id = rp.permission_id
            WHERE rp.role_id = :role_id
            ORDER BY p.permission_name
        """), {"role_id": role_id}).fetchall()
        return [r[0] for r in rows]
    except Exception as e:
        print(f"Error getting role permissions: {e}")
        return []
    finally:
        db.close()


def set_role_permissions(role_id: int, permission_names: list[str]) -> bool:
    """Replace all permissions for a role."""
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM roles_permissions WHERE role_id = :role_id"), {"role_id": role_id})
        if permission_names:
            db.execute(text("""
                INSERT INTO roles_permissions (role_id, permission_id)
                SELECT :role_id, p.permission_id
                FROM permissions p
                WHERE p.permission_name = ANY(:names)
            """), {"role_id": role_id, "names": permission_names})
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error setting role permissions: {e}")
        return False
    finally:
        db.close()


def get_user_permissions(user_id: int) -> set[str]:
    """Return all permission names a user has via their roles."""
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT DISTINCT p.permission_name
            FROM permissions p
            JOIN roles_permissions rp ON p.permission_id = rp.permission_id
            JOIN users_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = :user_id
        """), {"user_id": user_id}).fetchall()
        return {r[0] for r in rows}
    except Exception as e:
        print(f"Error getting user permissions: {e}")
        return set()
    finally:
        db.close()


def create_permission(name: str, description: str | None = None) -> dict | None:
    db = SessionLocal()
    try:
        result = db.execute(text("""
            INSERT INTO permissions (permission_name, permission_description)
            VALUES (:name, :description)
            RETURNING permission_id, permission_name, permission_description
        """), {"name": name, "description": description}).fetchone()
        db.commit()
        return {"id": result[0], "name": result[1], "description": result[2]}
    except Exception as e:
        db.rollback()
        print(f"Error creating permission: {e}")
        return None
    finally:
        db.close()


def update_permission(permission_id: int, name: str | None = None, description: str | None = None) -> dict | None:
    db = SessionLocal()
    try:
        fields = []
        params: dict = {"id": permission_id}
        if name is not None:
            fields.append("permission_name = :name")
            params["name"] = name
        if description is not None:
            fields.append("permission_description = :description")
            params["description"] = description
        if not fields:
            return None
        result = db.execute(text(f"""
            UPDATE permissions SET {', '.join(fields)}
            WHERE permission_id = :id
            RETURNING permission_id, permission_name, permission_description
        """), params).fetchone()
        db.commit()
        if not result:
            return None
        return {"id": result[0], "name": result[1], "description": result[2]}
    except Exception as e:
        db.rollback()
        print(f"Error updating permission: {e}")
        return None
    finally:
        db.close()


def delete_permission(permission_id: int) -> bool:
    db = SessionLocal()
    try:
        rowcount = db.execute(text(
            "DELETE FROM permissions WHERE permission_id = :id"
        ), {"id": permission_id}).rowcount
        db.commit()
        return rowcount > 0
    except Exception as e:
        db.rollback()
        print(f"Error deleting permission: {e}")
        return False
    finally:
        db.close()


def discord_roles_have_permission(discord_role_ids: list[str], permission: str) -> bool:
    """Check if any of the given Discord role IDs carry a specific permission.
    Used during login before the user's DB roles are guaranteed to be synced."""
    if not discord_role_ids:
        return False
    db = SessionLocal()
    try:
        placeholders = ', '.join(f':id_{i}' for i in range(len(discord_role_ids)))
        params = {f'id_{i}': discord_role_ids[i] for i in range(len(discord_role_ids))}
        params['permission'] = permission
        row = db.execute(text(f"""
            SELECT COUNT(*) FROM roles r
            JOIN roles_permissions rp ON r.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE r.role_discord_id IN ({placeholders})
              AND p.permission_name = :permission
        """), params).fetchone()
        return (row[0] or 0) > 0
    except Exception as e:
        print(f"Error checking discord role permission: {e}")
        return False
    finally:
        db.close()
