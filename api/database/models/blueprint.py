from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..connection import Base


class ItemCategory(Base):
    __tablename__ = "item_categories"

    uuid        = Column(String(36), primary_key=True)
    record_key  = Column(String(128), nullable=True)
    label       = Column(String(128), nullable=False)
    sort_order  = Column(Integer, nullable=True)

    blueprints  = relationship("Blueprint", back_populates="category")


class Blueprint(Base):
    __tablename__ = "blueprints"

    uuid               = Column(String(36), primary_key=True)
    key                = Column(String(255), nullable=True)
    category_uuid      = Column(String(36), ForeignKey("item_categories.uuid"), nullable=True)
    output_item_uuid   = Column(String(36), nullable=True)
    output_name        = Column(String(255), nullable=True)
    output_class       = Column(String(128), nullable=True)
    craft_time_seconds = Column(Integer, nullable=True)
    craft_time_label   = Column(String(32), nullable=True)
    ingredient_count   = Column(Integer, nullable=True)
    synced_at          = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    category        = relationship("ItemCategory", back_populates="blueprints")
    user_blueprints = relationship("UserBlueprint", back_populates="blueprint")
    ingredients     = relationship("BlueprintIngredient", back_populates="blueprint", cascade="all, delete-orphan")


class BlueprintIngredient(Base):
    __tablename__ = "blueprint_ingredients"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    blueprint_uuid     = Column(String(36), ForeignKey("blueprints.uuid", ondelete="CASCADE"), nullable=False, index=True)
    name               = Column(String(255), nullable=False)
    kind               = Column(String(32), nullable=True)
    resource_type_uuid = Column(String(36), nullable=True)
    item_uuid          = Column(String(36), nullable=True)
    quantity_scu       = Column(Float, nullable=True)
    quantity           = Column(Integer, nullable=True)

    blueprint = relationship("Blueprint", back_populates="ingredients")


class UserBlueprint(Base):
    __tablename__ = "user_blueprints"
    __table_args__ = (UniqueConstraint("user_id", "blueprint_uuid", name="uq_user_blueprint"),)

    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blueprint_uuid = Column(String(36), ForeignKey("blueprints.uuid", ondelete="CASCADE"), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.current_timestamp())

    blueprint = relationship("Blueprint", back_populates="user_blueprints")
