##############################################
# Tests for Permission Operations
##############################################
import pytest
from tests.factories.permissionFactory import PermissionFactory
from database.models.permission import Permission
from database.operations.permission_operations import (
    store_permission,
    getAllPermissions
)

##############################################
# Test for store_permission
##############################################
def test_store_permission(db_session):

    # Generate sample permission data and store it
    permission_data = PermissionFactory.build()
    permission = store_permission(permission_data)
    
    # Assert it
    assert permission is not None
    assert permission.permission_name == permission_data['permission_name']
    assert permission.permission_description == permission_data['permission_description']
    assert permission.permission_id is not None


def test_store_permission_duplicates(db_session):
    # Attempt to store a permission with a duplicate name
    permission_data = PermissionFactory.build(permission_name="UniquePermissionName")
    permission_1 = store_permission(permission_data)
    assert permission_1 is not None

    # Try to store another permission with the same name
    duplicate_permission_data = PermissionFactory.build(permission_name="UniquePermissionName")
    permission_2 = store_permission(duplicate_permission_data)
    assert permission_2 is None  # Should return None

def test_store_permission_with_invalid_data(db_session):
    # Attempt to store a permission with invalid data
    invalid_permission_data = {
        'permission_name': 'A' * 31,  # Exceeds max length of 30
        'permission_description': 'This is a test description that is way too long' * 10  # Exceeds max length of 255
    }
    
    permission = store_permission(invalid_permission_data)
    assert permission is None  # Should return None

##############################################
# Test for getAllPermissions
##############################################
def test_getAllPermissions(db_session):
    # Store some permissions
    permission_1 = PermissionFactory.create(db_session, permission_name="Permissions_1")
    permission_2 = PermissionFactory.create(db_session, permission_name="Permission_2")

    # Retrieve all permissions
    permissions = getAllPermissions()

    assert len(permissions) >= 2  # At least the two we created should be present
    assert any(permission.permission_name == "Permissions_1" for permission in permissions)
    assert any(permission.permission_name == "Permission_2" for permission in permissions)