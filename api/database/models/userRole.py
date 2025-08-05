from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..connection import Base

class UserRole(Base):
    __tablename__ = 'users_roles'

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True, nullable=False)
    role_id = Column(Integer, ForeignKey('roles.role_id'), primary_key=True, nullable=False)
    

    # Relationships
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")