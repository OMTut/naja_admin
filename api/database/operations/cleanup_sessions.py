#!/usr/bin/env python3
"""
Session Cleanup Script
Can be run manually or via cron job to clean up expired and old sessions.
Currently, it's being used as a background task from the main api app
"""

import sys
import os
from datetime import datetime, timedelta

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from api.database.operations.session_operations import cleanup_expired_sessions
from api.database.connection import SessionLocal
from api.database.models.session import Session
from sqlalchemy.orm import Session as DBSession


def cleanup_old_inactive_sessions(inactive_days: int = 30) -> int:
    """
    Clean up sessions that haven't been accessed in X days (even if not expired)
    
    Args:
        inactive_days: Number of days of inactivity before cleanup
    
    Returns:
        Number of sessions cleaned up
    """
    db: DBSession = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=inactive_days)
        
        # Delete sessions that haven't been accessed in X days
        deleted_count = db.query(Session).filter(
            Session.last_accessed_at < cutoff_date
        ).delete()
        
        db.commit()
        return deleted_count
        
    except Exception as e:
        db.rollback()
        print(f"Error cleaning up old inactive sessions: {e}")
        return 0
    finally:
        db.close()


def main():
    """Main cleanup function"""
    print(f"Starting session cleanup at {datetime.utcnow()}")
    
    # Clean up expired sessions
    expired_count = cleanup_expired_sessions()
    print(f"Cleaned up {expired_count} expired sessions")
    
    # Clean up old inactive sessions (30 days)
    inactive_count = cleanup_old_inactive_sessions(30)
    print(f"Cleaned up {inactive_count} inactive sessions (30+ days old)")
    
    total_cleaned = expired_count + inactive_count
    print(f"Total sessions cleaned: {total_cleaned}")
    
    if total_cleaned == 0:
        print("No sessions needed cleanup")
    
    print("Session cleanup completed")


if __name__ == "__main__":
    main()
