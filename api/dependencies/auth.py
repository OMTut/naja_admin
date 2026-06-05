"""
Shared FastAPI dependencies for authentication.
"""
from fastapi import Request, HTTPException, Depends
from routes.auth.session import get_session, is_session_valid
from database.operations.session_operations import get_user_from_session
from database.operations.users_roles import get_user_roles


def require_session(request: Request):
    """
    FastAPI dependency — validates the session cookie and returns the user.
    Raises 401 if the session is missing, expired, or invalid.
    """
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = get_session(session_id)
    if not session or not is_session_valid(session):
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    user = get_user_from_session(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_roles(*roles: str):
    """
    FastAPI dependency factory — requires the user to have at least one of the
    specified role names in addition to a valid session.

    Usage:
        @router.get("/admin/thing", dependencies=[Depends(require_roles("Role 1", "App Admin"))])
    """
    def dependency(user=Depends(require_session)):
        user_roles = {r["role_name"] for r in get_user_roles(user.id)}
        if not user_roles.intersection(roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency
