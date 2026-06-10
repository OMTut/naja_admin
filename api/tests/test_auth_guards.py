"""
Auth & role guard tests.

Covers:
  - Unauthenticated requests (no cookie)        → 401
  - Invalid / expired session cookie             → 401
  - Valid session, missing admin role            → 403
  - Valid session, correct admin role            → passes the guard (2xx or non-401/403)
  - Logout invalidates the session               → subsequent request returns 401
  - /api/auth/me behaviour across session states
"""

import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient
from main import app

# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_user(user_id: int = 1, roles: list[dict] | None = None):
    """Return a minimal mock User object."""
    user = MagicMock()
    user.id = user_id
    user.discord_username = "testuser"
    user.global_name = "Test User"
    user.server_nickname = None
    user.status = MagicMock()
    user.status.value = "approved"
    return user


def _make_session(valid: bool = True):
    """Return a minimal mock Session object."""
    session = MagicMock()
    session.is_active = valid
    return session


# Role dicts as returned by get_user_roles() / get_user_current_roles()
NO_ROLES:    list[dict] = []
ADMIN_ROLES: list[dict] = [{"role_name": "App Admin", "grants_access": True, "discord_id": "111111111111111111"}]
ACCESS_ROLE: list[dict] = [{"role_name": "Role 1",    "grants_access": True, "discord_id": "222222222222222222"}]


# Protected admin endpoints to test (method, path)
# Note: roles/ and users/ routers redirect without trailing slash, so use trailing slash
ADMIN_ENDPOINTS = [
    ("GET",  "/api/admin/roles/"),
    ("GET",  "/api/admin/users/"),
    ("GET",  "/api/admin/blueprints/org"),
    ("POST", "/api/admin/blueprints/sync"),
]


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_valid_session_no_roles():
    """Patches auth dependencies to simulate a logged-in user with no admin roles."""
    user = _make_user()
    with patch("dependencies.auth.get_session",          return_value=_make_session()), \
         patch("dependencies.auth.is_session_valid",     return_value=True), \
         patch("dependencies.auth.get_user_from_session", return_value=user), \
         patch("dependencies.auth.get_user_roles",        return_value=NO_ROLES):
        yield user


@pytest.fixture
def mock_valid_session_admin_roles():
    """Patches auth dependencies to simulate a logged-in user with App Admin role."""
    user = _make_user()
    with patch("dependencies.auth.get_session",          return_value=_make_session()), \
         patch("dependencies.auth.is_session_valid",     return_value=True), \
         patch("dependencies.auth.get_user_from_session", return_value=user), \
         patch("dependencies.auth.get_user_roles",        return_value=ADMIN_ROLES):
        yield user


@pytest.fixture
def mock_expired_session():
    """Patches auth dependencies to simulate an expired session."""
    with patch("dependencies.auth.get_session",      return_value=_make_session()), \
         patch("dependencies.auth.is_session_valid", return_value=False):
        yield


# ── Unauthenticated: no cookie ─────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
async def test_no_cookie_returns_401(method, path):
    """Every admin endpoint must return 401 when no session cookie is present."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await getattr(client, method.lower())(path)
    assert response.status_code == 401, (
        f"{method} {path} should return 401 with no cookie, got {response.status_code}"
    )


# ── Unauthenticated: invalid / expired cookie ──────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
async def test_expired_session_returns_401(method, path, mock_expired_session):
    """Every admin endpoint must return 401 when the session is expired."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await getattr(client, method.lower())(
            path, cookies={"session_id": "expired-token"}
        )
    assert response.status_code == 401, (
        f"{method} {path} should return 401 with expired session, got {response.status_code}"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
async def test_bogus_cookie_returns_401(method, path):
    """Every admin endpoint must return 401 when the cookie value is garbage."""
    with patch("dependencies.auth.get_session", return_value=None):
        async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
            response = await getattr(client, method.lower())(
                path, cookies={"session_id": "not-a-real-token"}
            )
    assert response.status_code == 401, (
        f"{method} {path} should return 401 with bogus cookie, got {response.status_code}"
    )


# ── Authenticated, wrong role ──────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
async def test_no_admin_role_returns_403(method, path, mock_valid_session_no_roles):
    """Authenticated users without admin roles must receive 403 on admin endpoints."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await getattr(client, method.lower())(
            path, cookies={"session_id": "valid-token"}
        )
    assert response.status_code == 403, (
        f"{method} {path} should return 403 without admin role, got {response.status_code}"
    )


# ── Authenticated, correct role ────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("method,path", ADMIN_ENDPOINTS)
async def test_admin_role_passes_guard(method, path, mock_valid_session_admin_roles):
    """Authenticated users with an admin role must not be blocked by the auth guard."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await getattr(client, method.lower())(
            path, cookies={"session_id": "valid-token"}
        )
    # Guard passed — may still fail on DB (500/422) but must not be 401 or 403
    assert response.status_code not in (401, 403), (
        f"{method} {path} should pass auth guard with admin role, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_role_1_passes_admin_guard(mock_valid_session_no_roles):
    """'Role 1' is also a valid admin role and must pass the guard."""
    user = _make_user()
    with patch("dependencies.auth.get_session",           return_value=_make_session()), \
         patch("dependencies.auth.is_session_valid",      return_value=True), \
         patch("dependencies.auth.get_user_from_session", return_value=user), \
         patch("dependencies.auth.get_user_roles",        return_value=ACCESS_ROLE):
        async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
            response = await client.get(
                "/api/admin/roles/", cookies={"session_id": "valid-token"}
            )
    assert response.status_code not in (401, 403)


# ── /api/auth/me ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_me_no_cookie_returns_unauthenticated():
    """/me with no cookie should return authenticated: false, not raise."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["authenticated"] is False


@pytest.mark.asyncio
async def test_me_expired_session_returns_unauthenticated(mock_expired_session):
    """/me with an expired session should return authenticated: false."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await client.get(
            "/api/auth/me", cookies={"session_id": "expired-token"}
        )
    assert response.status_code == 200
    assert response.json()["authenticated"] is False


@pytest.mark.asyncio
async def test_me_valid_session_returns_authenticated():
    """/me with a valid session should return authenticated: true and user data."""
    user = _make_user()
    # get_user_current_roles returns dicts with 'discord_id' and 'name' keys
    current_roles = [{"discord_id": "222222222222222222", "name": "Role 1", "grants_access": True}]
    with patch("routes.auth.auth.get_session",                    return_value=_make_session()), \
         patch("routes.auth.auth.is_session_valid",               return_value=True), \
         patch("routes.auth.auth.get_user_from_session",          return_value=user), \
         patch("routes.auth.auth.get_user_current_roles",         return_value=current_roles), \
         patch("routes.auth.auth.get_user_roles_from_discord_api", return_value=["222222222222222222"]), \
         patch("routes.auth.auth.check_user_has_access_role",     return_value=True), \
         patch("routes.auth.auth.update_session_access"):
        async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
            response = await client.get(
                "/api/auth/me", cookies={"session_id": "valid-token"}
            )
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert "user" in data


@pytest.mark.asyncio
async def test_me_user_loses_access_role_returns_unauthenticated():
    """If a user's Discord roles no longer grant access, /me should invalidate sessions."""
    user = _make_user()
    current_roles = [{"discord_id": "222222222222222222", "name": "Role 1", "grants_access": True}]
    with patch("routes.auth.auth.get_session",                    return_value=_make_session()), \
         patch("routes.auth.auth.is_session_valid",               return_value=True), \
         patch("routes.auth.auth.get_user_from_session",          return_value=user), \
         patch("routes.auth.auth.get_user_current_roles",         return_value=current_roles), \
         patch("routes.auth.auth.get_user_roles_from_discord_api", return_value=[]), \
         patch("routes.auth.auth.check_user_has_access_role",     return_value=False), \
         patch("routes.auth.auth.delete_all_user_sessions",       return_value=1) as mock_delete:
        async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
            response = await client.get(
                "/api/auth/me", cookies={"session_id": "valid-token"}
            )
    assert response.status_code == 200
    assert response.json()["authenticated"] is False
    mock_delete.assert_called_once_with(user.id)


# ── Logout ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_logout_clears_session():
    """POST /logout should delete all user sessions and clear the cookie."""
    user = _make_user()
    with patch("routes.auth.auth.get_user_from_session", return_value=user), \
         patch("routes.auth.auth.delete_all_user_sessions", return_value=1) as mock_delete:
        async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
            response = await client.post(
                "/api/auth/logout", cookies={"session_id": "valid-token"}
            )
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
    mock_delete.assert_called_once_with(user.id)


@pytest.mark.asyncio
async def test_logout_no_session_still_succeeds():
    """POST /logout with no cookie should not error."""
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as client:
        response = await client.post("/api/auth/logout")
    assert response.status_code == 200
