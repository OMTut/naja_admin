import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
@pytest.mark.unit
@pytest.mark.endpoints
async def test_root_endpoint():
    """Test the root endpoint returns correct message."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Auth API is running!"


@pytest.mark.asyncio
@pytest.mark.unit
@pytest.mark.endpoints
async def test_health_endpoint():
    """Test the health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data == {"status": "healthy"}


@pytest.mark.asyncio
@pytest.mark.unit
@pytest.mark.endpoints
async def test_nonexistent_endpoint():
    """Test that nonexistent endpoints return 404."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/nonexistent")
        
        assert response.status_code == 404
