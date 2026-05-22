"""
Shared FastAPI dependencies for authentication.
"""
from fastapi import Request, HTTPException
from routes.auth.session import get_session, is_session_valid
from database.operations.session_operations import get_user_from_session


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
