from sqlalchemy.orm import Session as DBSession
from sqlalchemy.exc import IntegrityError
from typing import Optional
from datetime import datetime, timedelta
import secrets

from ..models.session import Session
from ..models.user import User
from ..connection import SessionLocal


def create_session(user_id: int, expires_in_days: int = 7, lazy_cleanup: bool = True) -> Optional[str]:
    """
    Create a new session for the user in the database
    
    Args:
        user_id: The ID of the user
        expires_in_days: Number of days until session expires (default 7)
        lazy_cleanup: Whether to clean up expired sessions during creation
    
    Returns:
        Session ID if successful, None otherwise
    """
    db: DBSession = SessionLocal()
    try:
        # Lazy cleanup: remove expired sessions when creating new ones
        if lazy_cleanup:
            expired_count = db.query(Session).filter(
                Session.expires_at < datetime.utcnow()
            ).delete()
            if expired_count > 0:
                print(f"Lazy cleanup: removed {expired_count} expired sessions")
        # Generate a secure session ID
        session_id = secrets.token_urlsafe(32)
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create session object
        session = Session(
            id=session_id,
            user_id=user_id,
            expires_at=expires_at,
            is_active=True,
            last_accessed_at=datetime.utcnow()
        )
        
        db.add(session)
        db.commit()
        
        return session_id
        
    except IntegrityError as e:
        db.rollback()
        print(f"Integrity error creating session: {e.orig}")
        return None
    except Exception as e:
        db.rollback()
        print(f"Error creating session: {e}")
        return None
    finally:
        db.close()


def get_session(session_id: str) -> Optional[Session]:
    """
    Get session from database by session ID
    
    Args:
        session_id: The session ID to look up
    
    Returns:
        Session object if found and valid, None otherwise
    """
    db: DBSession = SessionLocal()
    try:
        session = db.query(Session).filter(
            Session.id == session_id,
            Session.is_active == True
        ).first()
        
        return session
        
    except Exception as e:
        print(f"Error retrieving session {session_id}: {e}")
        return None
    finally:
        db.close()


def get_user_from_session(session_id: str) -> Optional[User]:
    """
    Get user associated with a session
    
    Args:
        session_id: The session ID
    
    Returns:
        User object if session is valid, None otherwise
    """
    db: DBSession = SessionLocal()
    try:
        # Join session and user tables
        result = db.query(User).join(Session).filter(
            Session.id == session_id,
            Session.is_active == True
        ).first()
        
        return result
        
    except Exception as e:
        print(f"Error getting user from session {session_id}: {e}")
        return None
    finally:
        db.close()


def update_session_access(session_id: str) -> bool:
    """
    Update the session's last accessed time
    
    Args:
        session_id: The session ID
    
    Returns:
        True if successful, False otherwise
    """
    db: DBSession = SessionLocal()
    try:
        session = db.query(Session).filter(
            Session.id == session_id,
            Session.is_active == True
        ).first()

        if session:
            session.last_accessed_at = datetime.utcnow()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"Error updating session access time {session_id}: {e}")
        return False
    finally:
        db.close()


def invalidate_session(session_id: str) -> bool:
    """
    Invalidate a session by setting is_active to False
    
    Args:
        session_id: The session ID to invalidate
    
    Returns:
        True if successful, False otherwise
    """
    db: DBSession = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        
        if session:
            session.is_active = False
            db.commit()
            return True
        
        return False
        
    except Exception as e:
        db.rollback()
        print(f"Error invalidating session {session_id}: {e}")
        return False
    finally:
        db.close()


def cleanup_expired_sessions() -> int:
    """
    Remove expired sessions from the database
    This should be run periodically (e.g., via a cron job)
    
    Returns:
        Number of sessions cleaned up
    """
    db: DBSession = SessionLocal()
    try:
        # Delete sessions that are expired
        deleted_count = db.query(Session).filter(
            Session.expires_at < datetime.utcnow()
        ).delete()
        
        db.commit()
        return deleted_count
        
    except Exception as e:
        db.rollback()
        print(f"Error cleaning up expired sessions: {e}")
        return 0
    finally:
        db.close()


def invalidate_all_user_sessions(user_id: int) -> int:
    """
    Invalidate all sessions for a specific user
    Useful for forcing logout on all devices
    
    Args:
        user_id: The user ID
    
    Returns:
        Number of sessions invalidated
    """
    db: DBSession = SessionLocal()
    try:
        updated_count = db.query(Session).filter(
            Session.user_id == user_id,
            Session.is_active == True
        ).update({"is_active": False})
        
        db.commit()
        return updated_count
        
    except Exception as e:
        db.rollback()
        print(f"Error invalidating user sessions for user {user_id}: {e}")
        return 0
    finally:
        db.close()
