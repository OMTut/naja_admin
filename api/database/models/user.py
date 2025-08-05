from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from ..connection import Base

class UserStatus(enum.Enum):
    """User status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    BANNED = "banned"

class User(Base):
    """User model for storing Discord user information"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)  # SERIAL PRIMARY KEY
    discord_id = Column(String(20), unique=True, nullable=False, index=True)  # VARCHAR(20) UNIQUE NOT NULL
    discord_username = Column(String(32), nullable=False)  # VARCHAR(32) NOT NULL
    server_nickname = Column(String(32), nullable=True)  # VARCHAR(32) - Server nickname
    email = Column(String(255))  # VARCHAR(255)
    status = Column(
        Enum(UserStatus), 
        default=UserStatus.PENDING,  # DEFAULT 'pending'
        nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.current_timestamp()  # TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()  # TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    last_login_at = Column(
        DateTime(timezone=True), 
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()  # TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    
    def __repr__(self):
        return f"<User(discord_id='{self.discord_id}', username='{self.discord_username}', status='{self.status.value}')>"
    
    def is_active(self) -> bool:
        """Check if user is approved and not banned"""
        return self.status == UserStatus.APPROVED
    
    # Relationships - temporarily commented out until migration issue is resolved
    # roles = relationship("Role", secondary="users_roles")
    # permissions = relationship("Permission", secondary="users_permissions")

