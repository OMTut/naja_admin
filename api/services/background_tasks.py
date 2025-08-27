"""
Background tasks service for periodic maintenance tasks
"""
import asyncio
import os
from typing import Optional, Dict, Any
from datetime import datetime
from database.operations.session_operations import cleanup_expired_sessions


class BackgroundTaskManager:
    """Manages background tasks for the application"""
    
    def __init__(self):
        # Configuration from environment variables
        self.session_cleanup_interval = int(os.getenv("SESSION_CLEANUP_INTERVAL_HOURS", "1"))
        self.inactive_cleanup_interval = int(os.getenv("INACTIVE_CLEANUP_INTERVAL_HOURS", "24"))
        
        # Task tracking
        self.tasks: Dict[str, asyncio.Task] = {}
        self._running = False
        
        # Statistics
        self.stats = {
            "session_cleanups": 0,
            "last_cleanup": None,
            "total_sessions_cleaned": 0
        }
    
    async def start(self):
        """Start all background tasks"""
        if self._running:
            print("Background tasks already running")
            return
        
        self._running = True
        
        # Start session cleanup task
        self.tasks["session_cleanup"] = asyncio.create_task(
            self._session_cleanup_loop(),
            name="session_cleanup"
        )
        
        # Start inactive session cleanup task (runs less frequently)
        self.tasks["inactive_cleanup"] = asyncio.create_task(
            self._inactive_cleanup_loop(),
            name="inactive_cleanup"
        )
        
        print(f"✅ Background tasks started:")
        print(f"   • Session cleanup: every {self.session_cleanup_interval} hour(s)")
        print(f"   • Inactive cleanup: every {self.inactive_cleanup_interval} hour(s)")
    
    async def stop(self):
        """Stop all background tasks gracefully"""
        if not self._running:
            return
        
        self._running = False
        print("🛑 Stopping background tasks...")
        
        # Cancel all tasks
        for task_name, task in self.tasks.items():
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    print(f"   • {task_name} stopped")
        
        self.tasks.clear()
        print("✅ All background tasks stopped")
    
    async def _session_cleanup_loop(self):
        """Background loop for expired session cleanup"""
        while self._running:
            try:
                # Wait for the specified interval
                await asyncio.sleep(self.session_cleanup_interval * 3600)
                
                if not self._running:
                    break
                
                # Perform cleanup
                deleted_count = cleanup_expired_sessions()
                
                # Update statistics
                self.stats["session_cleanups"] += 1
                self.stats["last_cleanup"] = datetime.now()
                self.stats["total_sessions_cleaned"] += deleted_count
                
                if deleted_count > 0:
                    print(f"🧹 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
                          f"Session cleanup: removed {deleted_count} expired sessions")
                
            except asyncio.CancelledError:
                print("Session cleanup task cancelled")
                break
            except Exception as e:
                print(f"❌ Error in session cleanup: {e}")
                # Wait a bit before retrying to avoid tight error loops
                await asyncio.sleep(300)  # 5 minutes
    
    async def _inactive_cleanup_loop(self):
        """Background loop for inactive session cleanup (runs less frequently)"""
        while self._running:
            try:
                # Wait for the specified interval (typically 24 hours)
                await asyncio.sleep(self.inactive_cleanup_interval * 3600)
                
                if not self._running:
                    break
                
                # Import the function from your existing cleanup script
                from database.operations.cleanup_sessions import cleanup_old_inactive_sessions
                
                # Clean up sessions inactive for 30+ days
                inactive_count = cleanup_old_inactive_sessions(30)
                
                if inactive_count > 0:
                    print(f"🧹 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
                          f"Inactive cleanup: removed {inactive_count} old sessions")
                
            except asyncio.CancelledError:
                print("Inactive cleanup task cancelled")
                break
            except Exception as e:
                print(f"❌ Error in inactive cleanup: {e}")
                await asyncio.sleep(3600)  # Wait 1 hour before retrying
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of background tasks"""
        return {
            "running": self._running,
            "active_tasks": list(self.tasks.keys()),
            "configuration": {
                "session_cleanup_interval_hours": self.session_cleanup_interval,
                "inactive_cleanup_interval_hours": self.inactive_cleanup_interval
            },
            "statistics": self.stats.copy()
        }
    
    async def force_cleanup(self) -> Dict[str, int]:
        """Manually trigger cleanup (useful for testing or admin endpoints)"""
        try:
            expired_count = cleanup_expired_sessions()
            
            # Also try inactive cleanup
            from database.operations.cleanup_sessions import cleanup_old_inactive_sessions
            inactive_count = cleanup_old_inactive_sessions(30)
            
            # Update stats
            self.stats["total_sessions_cleaned"] += expired_count + inactive_count
            self.stats["last_cleanup"] = datetime.now()
            
            return {
                "expired_sessions_cleaned": expired_count,
                "inactive_sessions_cleaned": inactive_count,
                "total_cleaned": expired_count + inactive_count
            }
        except Exception as e:
            print(f"❌ Error in manual cleanup: {e}")
            raise


# Global instance - singleton pattern
background_manager = BackgroundTaskManager()


# Convenience functions for main.py
async def start_background_tasks():
    """Start background tasks - called from FastAPI lifespan"""
    await background_manager.start()


async def stop_background_tasks():
    """Stop background tasks - called from FastAPI lifespan"""
    await background_manager.stop()


def get_background_tasks_status():
    """Get status of background tasks - useful for health endpoints"""
    return background_manager.get_status()


async def manual_cleanup():
    """Manually trigger cleanup - useful for admin endpoints"""
    return await background_manager.force_cleanup()
