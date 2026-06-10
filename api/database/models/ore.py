from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..connection import Base


class Ore(Base):
    __tablename__ = "ores"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    display_name = Column(String(255), unique=True, nullable=False)
    type         = Column(String(32), nullable=True)
    synced_at    = Column(DateTime(timezone=True), server_default=func.current_timestamp())
