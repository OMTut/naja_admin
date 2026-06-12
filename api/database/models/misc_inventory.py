from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..connection import Base


class MiscCategory(Base):
    __tablename__ = "inventory_categories"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    catalog_items = relationship("InventoryCatalog", back_populates="category_obj")


class InventoryCatalog(Base):
    __tablename__ = "inventory_catalog"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    display_name = Column(String(255), nullable=False)
    category_id  = Column(Integer, ForeignKey("inventory_categories.id", ondelete="SET NULL"), nullable=True)
    created_by   = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    category_obj = relationship("MiscCategory", back_populates="catalog_items")
    creator      = relationship("User", foreign_keys=[created_by])
    holdings     = relationship("MiscInventory", back_populates="catalog_item")


class MiscInventory(Base):
    __tablename__ = "inventory_misc"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    catalog_item_id = Column(Integer, ForeignKey("inventory_catalog.id", ondelete="RESTRICT"), nullable=False)
    location        = Column(String(255), nullable=True)
    quantity        = Column(Integer, nullable=False, default=1)
    status          = Column(String(20), nullable=False, default="active")  # active | depleted
    held_by         = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    added_by        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.current_timestamp())
    updated_at      = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    catalog_item  = relationship("InventoryCatalog", back_populates="holdings")
    held_by_user  = relationship("User", foreign_keys=[held_by])
    added_by_user = relationship("User", foreign_keys=[added_by])
    events        = relationship(
        "MiscInventoryEvent",
        back_populates="item",
        order_by="MiscInventoryEvent.created_at",
    )


class MiscInventoryEvent(Base):
    __tablename__ = "inventory_misc_events"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    item_id         = Column(Integer, ForeignKey("inventory_misc.id", ondelete="CASCADE"), nullable=False)
    event_type      = Column(String(20), nullable=False)   # added | transferred | consumed
    quantity        = Column(Integer, nullable=False)
    from_user_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    to_user_id      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    performed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    item         = relationship("MiscInventory", back_populates="events")
    from_user    = relationship("User", foreign_keys=[from_user_id])
    to_user      = relationship("User", foreign_keys=[to_user_id])
    performed_by = relationship("User", foreign_keys=[performed_by_id])
