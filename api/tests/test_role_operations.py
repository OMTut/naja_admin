##############################################
# Tests for Role Operations
##############################################
import pytest
from tests.factories.roleFactory import RoleFactory
from database.models.role import Role
from database.operations.role_operations import (
    store_role,
    getRoleIdByName,
    getRoleByRoleId,
    getAllRoles,
    delete_role,
    update_role,
    role_exists
)

##############################################
# Test for store_role
##############################################
def test_store_role(db_session):

    # Generate sample role data and store it
    role_data = RoleFactory.build()
    role = store_role(role_data)
    
    # Assert it
    assert role is not None
    assert role.role_name == role_data['role_name']
    assert role.role_discord_id == role_data['role_discord_id']
    assert role.role_description == role_data['role_description']
    assert role.role_id is not None


def test_store_role_duplicates(db_session):
    # Attempt to store a role with a duplicate name
    role_data = RoleFactory.build(role_name="UniqueRoleName")
    role_1 = store_role(role_data)
    assert role_1 is not None

    # Try to store another role with the same name
    duplicate_role_data = RoleFactory.build(role_name="UniqueRoleName")
    role_2 = store_role(duplicate_role_data)
    assert role_2 is None  # Should return None

    role_data = RoleFactory.build(role_discord_id="12345678901234567")
    role_3 = store_role(role_data)
    assert role_3 is not None

    duplicate_role_data = RoleFactory.build(role_discord_id="12345678901234567")
    role_4 = store_role(duplicate_role_data)
    assert role_4 is None  # Should return None

def test_store_role_with_invalid_data(db_session):
    # Attempt to store a role with invalid data
    invalid_role_data = {
        'role_discord_id': 'invalid_id',  # Not a valid ID
        'role_name': 'A' * 31,  # Exceeds max length of 30
        'role_description': 'This is a test description that is way too long' * 10  # Exceeds max length of 255
    }
    
    role = store_role(invalid_role_data)
    assert role is None  # Should return None

##############################################
# Test for getAllRoles
##############################################
def test_getAllRoles(db_session):
    # Store some roles
    role_1 = RoleFactory.create(db_session, role_name="RoleOne")
    role_2 = RoleFactory.create(db_session, role_name="RoleTwo")

    # Retrieve all roles
    roles = getAllRoles()

    assert len(roles) >= 2  # At least the two we created should be present
    assert any(role.role_name == "RoleOne" for role in roles)
    assert any(role.role_name == "RoleTwo" for role in roles)

##############################################
# Test for getRoleIdByName
##############################################
def test_getRoleIdByName(db_session):

    # First store the role
    role_data = RoleFactory.build(role_name="TestRole")
    stored_role = store_role(role_data)

    # Retrieve by name
    retrieved_role_id = getRoleIdByName("TestRole")

    assert retrieved_role_id is not None
    assert retrieved_role_id == stored_role.role_id


def test_getRoleIdByName_nonexistent(db_session):
    """Test retrieving a non-existent role by name"""
    role_id = getRoleIdByName("NonExistentRole")
    assert role_id is None


##############################################
# Test for getRoleByRoleId
##############################################
def test_getRoleByRoleId(db_session):
    """Test retrieving a role by its ID"""
    # Store a role first
    role_data = RoleFactory.build(role_name="TestRoleById")
    stored_role = store_role(role_data)
    
    # Retrieve by ID
    retrieved_role = getRoleByRoleId(stored_role.role_id)
    
    assert retrieved_role is not None
    assert retrieved_role.role_id == stored_role.role_id
    assert retrieved_role.role_name == "TestRoleById"
    assert retrieved_role.role_discord_id == stored_role.role_discord_id


def test_getRoleByRoleId_nonexistent(db_session):
    """Test retrieving a non-existent role by ID"""
    role = getRoleByRoleId(99999)  # ID that doesn't exist
    assert role is None


##############################################
# Test for delete_role
##############################################
def test_delete_role(db_session):
    """Test deleting a role by ID"""
    # Store a role first
    role_data = RoleFactory.build(role_name="RoleToDelete")
    stored_role = store_role(role_data)
    role_id = stored_role.role_id
    
    # Verify it exists
    assert getRoleByRoleId(role_id) is not None
    
    # Delete it
    result = delete_role(role_id)
    assert result is True
    
    # Verify it's gone
    assert getRoleByRoleId(role_id) is None


def test_delete_role_nonexistent(db_session):
    """Test deleting a non-existent role"""
    result = delete_role(99999)  # ID that doesn't exist
    assert result is False


##############################################
# Test for update_role
##############################################
def test_update_role(db_session):
    """Test updating a role"""
    # Store a role first
    role_data = RoleFactory.build(role_name="OriginalRole")
    stored_role = store_role(role_data)
    original_discord_id = stored_role.role_discord_id
    
    # Update it
    update_data = {
        'role_name': 'UpdatedRole',
        'role_description': 'Updated description'
    }
    updated_role = update_role(stored_role.role_id, update_data)
    
    assert updated_role is not None
    assert updated_role.role_name == 'UpdatedRole'
    assert updated_role.role_description == 'Updated description'
    assert updated_role.role_discord_id == original_discord_id  # Should remain unchanged
    assert updated_role.role_id == stored_role.role_id  # ID should remain same


def test_update_role_nonexistent(db_session):
    """Test updating a non-existent role"""
    update_data = {'role_name': 'NewName'}
    result = update_role(99999, update_data)  # ID that doesn't exist
    assert result is None


def test_update_role_partial(db_session):
    """Test updating only some fields of a role"""
    # Store a role first
    role_data = RoleFactory.build(
        role_name="PartialUpdateRole",
        role_description="Original description"
    )
    stored_role = store_role(role_data)
    
    # Update only the description
    update_data = {'role_description': 'New description only'}
    updated_role = update_role(stored_role.role_id, update_data)
    
    assert updated_role is not None
    assert updated_role.role_name == "PartialUpdateRole"  # Should remain unchanged
    assert updated_role.role_description == 'New description only'  # Should be updated


##############################################
# Test for role_exists
##############################################
def test_role_exists(db_session):
    """Test checking if a role exists"""
    # Store a role first
    role_data = RoleFactory.build(role_name="ExistingRole")
    store_role(role_data)
    
    # Check if it exists
    assert role_exists("ExistingRole") is True
    assert role_exists("NonExistentRole") is False


def test_role_exists_case_sensitive(db_session):
    """Test that role_exists is case sensitive"""
    # Store a role
    role_data = RoleFactory.build(role_name="CaseSensitiveRole")
    store_role(role_data)
    
    # Check case sensitivity
    assert role_exists("CaseSensitiveRole") is True
    assert role_exists("casesensitiverole") is False
    assert role_exists("CASESENSITIVEROLE") is False
