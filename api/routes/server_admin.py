"""
Admin routes for system management
"""
from fastapi import APIRouter, HTTPException, Depends
from services.background_tasks import manual_cleanup, get_background_tasks_status
from dependencies.auth import require_session

router = APIRouter()


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
