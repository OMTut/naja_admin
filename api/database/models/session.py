from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..connection import Base

class Session(Base):
    """Session model for storing user sessions"""
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)  # Session ID (UUID string)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.current_timestamp()
    )
    last_accessed_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationship to User model
    user = relationship("User", backref="sessions")
    
    def __repr__(self):
        return f"<Session(id='{self.id}', user_id={self.user_id}, expires_at='{self.expires_at}')>"
    
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at.replace(tzinfo=None) if self.expires_at.tzinfo else self.expires_at
    
    def is_valid(self) -> bool:
        """Check if session is valid (active and not expired)"""
        return self.is_active and not self.is_expired()

