"""
Admin routes for system management
"""
import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from services.background_tasks import manual_cleanup, get_background_tasks_status
from dependencies.auth import require_session

router = APIRouter()

GIBBS_API_URL = os.getenv("GIBBS_API_URL", "http://localhost:8001")


@router.get("/services/gibbs/health")
async def gibbs_health(_=Depends(require_session)):
    """Proxy Gibbs bot health check"""
    try:
        api_key = os.getenv("BOT_API_KEY", "")
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{GIBBS_API_URL}/health", headers={"X-API-Key": api_key})
        return {"online": res.is_success}
    except Exception:
        return {"online": False, "status_code": None}


@router.get("/background-tasks/status")
async def get_tasks_status(_=Depends(require_session)):
    """Get status of background tasks"""
    return get_background_tasks_status()


@router.post("/background-tasks/cleanup")
async def trigger_manual_cleanup(_=Depends(require_session)):
    """Manually trigger session cleanup"""
    try:
        result = await manual_cleanup()
        return {
            "success": True,
            "message": "Manual cleanup completed",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")
