from sqlalchemy import Column, Integer, String, DateTime, Enum, CheckConstraint
from sqlalchemy.sql import func
from datetime import datetime
from ..connection import Base

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, autoincrement=True)  # SERIAL PRIMARY KEY
    role_discord_id = Column(String(20), unique=True, nullable=False, index=True)  # VARCHAR(20) UNIQUE NOT NULL
    role_name = Column(String(32), unique=True, nullable=False)  # VARCHAR(32) UNIQUE NOT NULL
    role_description = Column(String(255), nullable=True)  # VARCHAR(255)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.current_timestamp()  # TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()  # TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )