from sqlalchemy import Column, Integer, String, DateTime, Enum, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from ..connection import Base

class Permission(Base):
    __tablename__ = "permissions"

    permission_id = Column(Integer, primary_key=True, autoincrement=True)  # SERIAL PRIMARY KEY
    permission_name = Column(String(32), unique=True, nullable=False)  # VARCHAR(32) UNIQUE NOT NULL
    permission_description = Column(String(255), nullable=True)  # VARCHAR(255)
    created_at = Column(DateTime, default=func.now())  # TIMESTAMP DEFAULT NOW()
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  # TIMESTAMP DEFAULT NOW() ON UPDATE NOW()

    # Relationships - temporarily commented out until migration issue is resolved
    # users = relationship("User", secondary="users_permissions")
    # roles = relationship("Role", secondary="role_permission")
