from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..connection import Base


class Role(Base):
    __tablename__ = "roles"

    role_id         = Column(Integer, primary_key=True, autoincrement=True)
    role_discord_id = Column(String(20), unique=True, nullable=False, index=True)
    role_name       = Column(String(32), unique=True, nullable=False)
    role_description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
