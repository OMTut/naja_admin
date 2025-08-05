######################################################################
# The RolePermission model isn't 'needed' like the others. However, it
# allows for easier operations. For example, defining the relationships
# between role and permission allows us to back_populate. This is a
# bi-directional relationship. We can get permissions fro a role using
# role.permission and roles from a permission using permission.roles.
######################################################################
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..connection import Base

class RolePermission(Base):
    __tablename__ = 'role_permission'

    role_id = Column(Integer, ForeignKey('roles.role_id'), primary_key=True, nullable=False)
    permission_id = Column(Integer, ForeignKey('permissions.permission_id'), primary_key=True, nullable=False)

    # Relationships
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")