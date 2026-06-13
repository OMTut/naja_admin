from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..connection import Base


class Permission(Base):
    __tablename__ = "permissions"

    permission_id          = Column(Integer, primary_key=True, autoincrement=True)
    permission_name        = Column(String(32), unique=True, nullable=False)
    permission_description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
