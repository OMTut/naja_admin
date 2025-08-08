##############################################
# Tests for Permission Operations
##############################################
import pytest
from tests.factories.permissionFactory import PermissionFactory
from database.models.permission import Permission
from database.operations.permission_operations import (
    store_permission,
    getAllPermissions,
    getPermissionIdByName,
    getPermissionById,
    getPermissionByName,
    delete_permission_by_id
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

##############################################
# Test for getPermissionIdByName
##############################################
def test_getPermissionById(db_session):
    # First store the role
    permission_data = PermissionFactory.build(permission_name="TestPermission")
    stored_permission = store_permission(permission_data)

    # Retrieve by name
    retreived_permission_id = getPermissionIdByName("TestPermission")

    assert retreived_permission_id is not None
    assert retreived_permission_id == stored_permission.permission_id


def test_getPermissionById_nonexistent(db_session):
    """Test retrieving a non-existent role by name"""
    permission_id = getPermissionIdByName("NonExistentPermission")
    assert permission_id is None


##############################################
# Test for getPermissionById
##############################################
def test_getPermissionById(db_session):
    """Test retrieving a permission by its ID"""
    # Store a permission first
    permission_data = PermissionFactory.build(permission_name="TestPermissionById")
    stored_permission = store_permission(permission_data)
    
    # Retrieve by ID
    retrieved_permission = getPermissionById(stored_permission.permission_id)
    
    assert retrieved_permission is not None
    assert retrieved_permission.permission_id == stored_permission.permission_id
    assert retrieved_permission.permission_name == "TestPermissionById"

##############################################
# Test for getPermissionByName
##############################################
def test_getPermissionByName(db_session):
    """Test retrieving a permission by its name"""
    # Store a permission first
    permission_data = PermissionFactory.build(permission_name="TestPermissionByName")
    stored_permission = store_permission(permission_data)
    
    # Retrieve by name
    retrieved_permission = getPermissionByName(stored_permission.permission_name)
    
    assert retrieved_permission is not None
    assert retrieved_permission.permission_id == stored_permission.permission_id
    assert retrieved_permission.permission_name == "TestPermissionByName"

##############################################
# Test for delete_permission_by_id
##############################################
def test_delete_permission_by_id(db_session):

    # Create and store Permission
    permission_data = PermissionFactory.build(permission_name="PermisionToDelete")
    stored_permission = store_permission(permission_data)
    permission_id = stored_permission.permission_id

    # Verify it exists
    assert getPermissionById(permission_id) is not None

    # Delete it
    result = delete_permission_by_id(permission_id)
    assert result is True

    assert getPermissionById(permission_id) is None

def test_delete_permission_nonexistent(db_session):
    result = delete_permission_by_id(99999)  # ID that doesn't exist
    assert result is False