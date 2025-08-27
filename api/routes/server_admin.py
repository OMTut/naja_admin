"""
Admin routes for system management
"""
from fastapi import APIRouter, HTTPException
from services.background_tasks import manual_cleanup, get_background_tasks_status

router = APIRouter()


@router.get("/background-tasks/status")
async def get_tasks_status():
    """Get status of background tasks"""
    return get_background_tasks_status()


@router.post("/background-tasks/cleanup")
async def trigger_manual_cleanup():
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
