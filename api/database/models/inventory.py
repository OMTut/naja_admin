from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..connection import Base


class ResourceInventory(Base):
    __tablename__ = "resource_inventory"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    ore_name     = Column(String(255), nullable=False)
    quality      = Column(Integer, nullable=True)
    original_scu = Column(Numeric(10, 3), nullable=False)
    current_scu  = Column(Numeric(10, 3), nullable=False)
    location     = Column(String(255), nullable=True)
    held_by      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    added_by     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.current_timestamp())
    updated_at   = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    held_by_user  = relationship("User", foreign_keys=[held_by])
    added_by_user = relationship("User", foreign_keys=[added_by])
