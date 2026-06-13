import pytest
from sqlalchemy import text
from faker import Faker
from database.operations.users_roles import (
    get_user_roles,
    add_user_role,
    remove_user_role,
    clear_user_roles,
    remove_role_from_all_users,
    get_roles_by_discord_ids
)
from database.operations.users.store_user_appending_approval import store_user_pending_approval
from database.models.role import Role

@pytest.mark.database
@pytest.mark.roles  
class TestUsersRolesOperations:
    """Test class for users_roles database operations"""

    ##########################################
    # Add user_role
    ##########################################
    def test_debug_check_tables(self, db_session):
        """Debug test to see what tables exist in test database"""
        result = db_session.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
        ))
        tables = [row[0] for row in result.fetchall()]
        print(f"\nTables in test database: {tables}")
        assert "users_roles" in tables, f"users_roles table missing. Found tables: {tables}"

    def test_add_user_role_success(self, db_session, sample_user_data):
        """Test successfully adding a role to a user"""
        fake = Faker()
        
        # Create the user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create a test role with faker data that respects DB constraints
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],  # Max 20 chars
            role_name=fake.word().capitalize()[:32],  # Use single word, max 32 chars
            role_description=fake.text(max_nb_chars=255)[:255],  # Max 255 chars
        )
        db_session.add(test_role)
        db_session.commit()
        
        # Refresh the role to make sure it's attached to the session
        db_session.refresh(test_role)
        test_role_id = test_role.role_id
        user_id = user.id
        
        # Test adding a role to the user
        result = add_user_role(user_id, test_role_id)
        
        assert result == True
        
        # Verify the role was added by checking database directly
        query = text("SELECT COUNT(*) FROM users_roles WHERE user_id = :user_id AND role_id = :role_id")
        result = db_session.execute(query, {"user_id": user_id, "role_id": test_role_id})
        count = result.scalar()
        assert count == 1

    def test_add_user_role_invalid_user(self, db_session):
        """Test adding role with invalid user ID"""
        invalid_user_id = -1
        test_role_id = 1
        
        result = add_user_role(invalid_user_id, test_role_id)
        
        # Should handle gracefully (exact behavior depends on your implementation)
        # Most likely should return False
        assert isinstance(result, bool)

    def test_add_user_role_invalid_role(self, db_session):
        """Test adding invalid role ID"""
        test_user_id = 999
        invalid_role_id = 99999
        
        result = add_user_role(test_user_id, invalid_role_id)
        
        # Should handle gracefully - likely return False due to foreign key constraint
        assert isinstance(result, bool)

    ######################################
    # Get User Roles
    ######################################
    def test_get_user_roles_success(self, db_session, sample_user_data):
        """Test successfully getting roles for a user"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create multiple test roles
        role1 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="Admin",  # Alphabetically first
            role_description=fake.text(max_nb_chars=100)[:255],
        )
        role2 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="User",  # Alphabetically second
            role_description=fake.text(max_nb_chars=100)[:255],
        )
        
        # Add roles to database
        db_session.add_all([role1, role2])
        db_session.commit()
        
        # Refresh roles to get their IDs
        db_session.refresh(role1)
        db_session.refresh(role2)
        
        # Store role data before session detachment
        role1_id = role1.role_id
        role1_discord_id = role1.role_discord_id
        role2_id = role2.role_id
        role2_discord_id = role2.role_discord_id
        user_id = user.id
        
        # Add both roles to the user
        add_result1 = add_user_role(user_id, role1_id)
        add_result2 = add_user_role(user_id, role2_id)
        assert add_result1 == True
        assert add_result2 == True
        
        # Get user roles
        user_roles = get_user_roles(user_id)
        
        # Verify the results
        assert len(user_roles) == 2
        
        # Verify the roles are ordered by role_name (Admin comes before User)
        assert user_roles[0]["role_name"] == "Admin"
        assert user_roles[0]["role_discord_id"] == role1_discord_id

        assert user_roles[1]["role_name"] == "User"
        assert user_roles[1]["role_discord_id"] == role2_discord_id

        # Verify the structure of returned dictionaries
        for role in user_roles:
            assert "role_discord_id" in role
            assert "role_name" in role

    def test_get_user_roles_no_roles(self, db_session, sample_user_data):
        """Test getting roles for a user who has no roles assigned"""
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Get user roles (should be empty)
        user_roles = get_user_roles(user.id)
        
        # Verify empty result
        assert isinstance(user_roles, list)
        assert len(user_roles) == 0

    def test_get_user_roles_nonexistent_user(self, db_session):
        """Test getting roles for a user that doesn't exist"""
        # Try to get roles for a non-existent user
        user_roles = get_user_roles(99999)  # User ID that doesn't exist
        
        # Should return empty list
        assert isinstance(user_roles, list)
        assert len(user_roles) == 0

    def test_get_user_roles_single_role(self, db_session, sample_user_data):
        """Test getting roles when user has only one role"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create one test role
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="Moderator",
            role_description="Test moderator role",
        )
        
        db_session.add(test_role)
        db_session.commit()
        db_session.refresh(test_role)
        
        # Store data before session detachment
        test_role_id = test_role.role_id
        test_role_discord_id = test_role.role_discord_id
        user_id = user.id
        
        # Add role to user
        add_result = add_user_role(user_id, test_role_id)
        assert add_result == True
        
        # Get user roles
        user_roles = get_user_roles(user_id)
        
        # Verify single role result
        assert len(user_roles) == 1
        assert user_roles[0]["role_name"] == "Moderator"
        assert user_roles[0]["role_discord_id"] == test_role_discord_id

    #######################################
    # Test remove_user_role
    #######################################
    def test_remove_user_role_success(self, db_session, sample_user_data):
        """Test successfully removing a role from a user"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create a test role
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="TestRole",
            role_description="Role to be removed",
        )
        
        db_session.add(test_role)
        db_session.commit()
        db_session.refresh(test_role)
        
        # Store data before session detachment
        test_role_id = test_role.role_id
        user_id = user.id
        
        # First add the role to the user
        add_result = add_user_role(user_id, test_role_id)
        assert add_result == True
        
        # Verify the role was added
        user_roles = get_user_roles(user_id)
        assert len(user_roles) == 1
        
        # Now remove the role
        remove_result = remove_user_role(user_id, test_role_id)
        assert remove_result == True
        
        # Verify the role was removed
        user_roles_after = get_user_roles(user_id)
        assert len(user_roles_after) == 0
        
        # Verify by checking database directly
        query = text("SELECT COUNT(*) FROM users_roles WHERE user_id = :user_id AND role_id = :role_id")
        result = db_session.execute(query, {"user_id": user_id, "role_id": test_role_id})
        count = result.scalar()
        assert count == 0

    def test_remove_user_role_nonexistent_relationship(self, db_session, sample_user_data):
        """Test removing a role that the user doesn't have"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create a test role
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="UnassignedRole",
            role_description="Role that user doesn't have",
        )
        
        db_session.add(test_role)
        db_session.commit()
        db_session.refresh(test_role)
        
        # Store data before session detachment
        test_role_id = test_role.role_id
        user_id = user.id
        
        # Try to remove a role that was never added
        remove_result = remove_user_role(user_id, test_role_id)
        assert remove_result == False  # Should return False since nothing was deleted

    def test_remove_user_role_invalid_user(self, db_session):
        """Test removing a role with invalid user ID"""
        invalid_user_id = -1
        test_role_id = 1
        
        result = remove_user_role(invalid_user_id, test_role_id)
        
        # Should handle gracefully and return False since no rows affected
        assert result == False

    def test_remove_user_role_invalid_role(self, db_session, sample_user_data):
        """Test removing an invalid role ID from a user"""
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        invalid_role_id = 99999
        user_id = user.id
        
        result = remove_user_role(user_id, invalid_role_id)
        
        # Should handle gracefully and return False since no rows affected
        assert result == False

    def test_remove_user_role_multiple_roles(self, db_session, sample_user_data):
        """Test removing one role when user has multiple roles"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create multiple test roles
        role1 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="AdminRole",
            role_description="Admin role",
        )
        role2 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="UserRole",
            role_description="User role",
        )
        
        db_session.add_all([role1, role2])
        db_session.commit()
        db_session.refresh(role1)
        db_session.refresh(role2)
        
        # Store data before session detachment
        role1_id = role1.role_id
        role2_id = role2.role_id
        user_id = user.id
        
        # Add both roles to the user
        add_result1 = add_user_role(user_id, role1_id)
        add_result2 = add_user_role(user_id, role2_id)
        assert add_result1 == True
        assert add_result2 == True
        
        # Verify user has both roles
        user_roles = get_user_roles(user_id)
        assert len(user_roles) == 2
        
        # Remove only one role
        remove_result = remove_user_role(user_id, role1_id)
        assert remove_result == True
        
        # Verify user now has only one role
        user_roles_after = get_user_roles(user_id)
        assert len(user_roles_after) == 1
        assert user_roles_after[0]["role_name"] == "UserRole"

    #######################################
    # Tests clear_user_roles()
    #######################################
    
    def test_clear_user_roles_success(self, db_session, sample_user_data):
        """Test successfully clearing all roles from a user"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create multiple test roles
        role1 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="AdminRole",
            role_description="Admin role",
        )
        role2 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="UserRole",
            role_description="User role",
        )
        role3 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="ModeratorRole",
            role_description="Moderator role",
        )
        
        db_session.add_all([role1, role2, role3])
        db_session.commit()
        db_session.refresh(role1)
        db_session.refresh(role2) 
        db_session.refresh(role3)
        
        # Store data before session detachment
        role1_id = role1.role_id
        role2_id = role2.role_id
        role3_id = role3.role_id
        user_id = user.id
        
        # Add all roles to the user
        add_result1 = add_user_role(user_id, role1_id)
        add_result2 = add_user_role(user_id, role2_id)
        add_result3 = add_user_role(user_id, role3_id)
        assert add_result1 == True
        assert add_result2 == True
        assert add_result3 == True
        
        # Verify user has all three roles
        user_roles = get_user_roles(user_id)
        assert len(user_roles) == 3
        
        # Clear all roles from the user
        clear_result = clear_user_roles(user_id)
        assert clear_result == True
        
        # Verify user has no roles
        user_roles_after = get_user_roles(user_id)
        assert len(user_roles_after) == 0
        
        # Verify by checking database directly
        query = text("SELECT COUNT(*) FROM users_roles WHERE user_id = :user_id")
        result = db_session.execute(query, {"user_id": user_id})
        count = result.scalar()
        assert count == 0

    def test_clear_user_roles_no_roles(self, db_session, sample_user_data):
        """Test clearing roles from a user who has no roles"""
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        user_id = user.id
        
        # Verify user has no roles initially
        user_roles = get_user_roles(user_id)
        assert len(user_roles) == 0
        
        # Try to clear roles from user with no roles
        clear_result = clear_user_roles(user_id)
        assert clear_result == False  # Should return False since no rows were affected

    def test_clear_user_roles_invalid_user(self, db_session):
        """Test clearing roles from an invalid user ID"""
        invalid_user_id = -1
        
        result = clear_user_roles(invalid_user_id)
        
        # Should handle gracefully and return False since no rows affected
        assert result == False

    def test_clear_user_roles_nonexistent_user(self, db_session):
        """Test clearing roles from a user that doesn't exist"""
        nonexistent_user_id = 99999
        
        result = clear_user_roles(nonexistent_user_id)
        
        # Should handle gracefully and return False since no rows affected
        assert result == False

    def test_clear_user_roles_single_role(self, db_session, sample_user_data):
        """Test clearing roles from a user with only one role"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create one test role
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="SingleRole",
            role_description="Only role for this test",
        )
        
        db_session.add(test_role)
        db_session.commit()
        db_session.refresh(test_role)
        
        # Store data before session detachment
        test_role_id = test_role.role_id
        user_id = user.id
        
        # Add the role to the user
        add_result = add_user_role(user_id, test_role_id)
        assert add_result == True
        
        # Verify user has the role
        user_roles = get_user_roles(user_id)
        assert len(user_roles) == 1
        
        # Clear the role
        clear_result = clear_user_roles(user_id)
        assert clear_result == True
        
        # Verify user has no roles
        user_roles_after = get_user_roles(user_id)
        assert len(user_roles_after) == 0

    def test_clear_user_roles_does_not_affect_other_users(self, db_session, sample_user_data):
        """Test that clearing roles from one user doesn't affect other users"""
        fake = Faker()
        
        # Create two test users
        user1_data = sample_user_data.copy()
        user1 = store_user_pending_approval(user1_data)
        
        user2_data = sample_user_data.copy()
        user2_data["id"] = str(fake.random_int(min=100000000000000000, max=999999999999999999))
        user2_data["username"] = fake.user_name()
        user2_data["email"] = fake.email()
        user2 = store_user_pending_approval(user2_data)
        
        assert user1 is not None
        assert user2 is not None
        
        # Create a test role
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="SharedRole",
            role_description="Role shared by both users",
        )
        
        db_session.add(test_role)
        db_session.commit()
        db_session.refresh(test_role)
        
        # Store data before session detachment
        test_role_id = test_role.role_id
        user1_id = user1.id
        user2_id = user2.id
        
        # Add the role to both users
        add_result1 = add_user_role(user1_id, test_role_id)
        add_result2 = add_user_role(user2_id, test_role_id)
        assert add_result1 == True
        assert add_result2 == True
        
        # Verify both users have the role
        user1_roles = get_user_roles(user1_id)
        user2_roles = get_user_roles(user2_id)
        assert len(user1_roles) == 1
        assert len(user2_roles) == 1
        
        # Clear roles from only user1
        clear_result = clear_user_roles(user1_id)
        assert clear_result == True
        
        # Verify user1 has no roles but user2 still has the role
        user1_roles_after = get_user_roles(user1_id)
        user2_roles_after = get_user_roles(user2_id)
        assert len(user1_roles_after) == 0
        assert len(user2_roles_after) == 1
        assert user2_roles_after[0]["role_name"] == "SharedRole"

    #######################################
    # Tests remove_role_from_all_users()
    #######################################
    
    def test_remove_role_from_all_users_success(self, db_session, sample_user_data):
        """Test successfully removing a role from all users who have it"""
        fake = Faker()
        
        # Create multiple test users
        user1_data = sample_user_data.copy()
        user1 = store_user_pending_approval(user1_data)
        
        user2_data = sample_user_data.copy()
        user2_data["id"] = str(fake.random_int(min=100000000000000000, max=999999999999999999))
        user2_data["username"] = fake.user_name()
        user2_data["email"] = fake.email()
        user2 = store_user_pending_approval(user2_data)
        
        user3_data = sample_user_data.copy()
        user3_data["id"] = str(fake.random_int(min=100000000000000000, max=999999999999999999))
        user3_data["username"] = fake.user_name()
        user3_data["email"] = fake.email()
        user3 = store_user_pending_approval(user3_data)
        
        assert user1 is not None
        assert user2 is not None
        assert user3 is not None
        
        # Create test roles
        role_to_remove = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="RoleToRemove",
            role_description="This role will be removed from all users",
        )
        other_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="OtherRole",
            role_description="This role should remain",
        )
        
        db_session.add_all([role_to_remove, other_role])
        db_session.commit()
        db_session.refresh(role_to_remove)
        db_session.refresh(other_role)
        
        # Store data before session detachment
        role_to_remove_id = role_to_remove.role_id
        other_role_id = other_role.role_id
        user1_id = user1.id
        user2_id = user2.id
        user3_id = user3.id
        
        # Add the role to be removed to users 1 and 3
        add_result1 = add_user_role(user1_id, role_to_remove_id)
        add_result3 = add_user_role(user3_id, role_to_remove_id)
        assert add_result1 == True
        assert add_result3 == True
        
        # Add the other role to users 2 and 3
        add_result2 = add_user_role(user2_id, other_role_id)
        add_result3_other = add_user_role(user3_id, other_role_id)
        assert add_result2 == True
        assert add_result3_other == True
        
        # Verify initial setup
        user1_roles = get_user_roles(user1_id)
        user2_roles = get_user_roles(user2_id)
        user3_roles = get_user_roles(user3_id)
        
        assert len(user1_roles) == 1  # Has role_to_remove
        assert len(user2_roles) == 1  # Has other_role
        assert len(user3_roles) == 2  # Has both roles
        
        # Remove the role from all users
        remove_result = remove_role_from_all_users(role_to_remove_id)
        assert remove_result == True
        
        # Verify the role was removed from all users
        user1_roles_after = get_user_roles(user1_id)
        user2_roles_after = get_user_roles(user2_id)
        user3_roles_after = get_user_roles(user3_id)
        
        assert len(user1_roles_after) == 0  # Role removed
        assert len(user2_roles_after) == 1  # Still has other_role
        assert len(user3_roles_after) == 1  # Only other_role remains
        assert user3_roles_after[0]["role_name"] == "OtherRole"
        
        # Verify by checking database directly
        query = text("SELECT COUNT(*) FROM users_roles WHERE role_id = :role_id")
        result = db_session.execute(query, {"role_id": role_to_remove_id})
        count = result.scalar()
        assert count == 0

    def test_remove_role_from_all_users_no_assignments(self, db_session):
        """Test removing a role that is not assigned to any users"""
        fake = Faker()
        
        # Create a test role that won't be assigned to anyone
        unassigned_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="UnassignedRole",
            role_description="This role is not assigned to anyone",
        )
        
        db_session.add(unassigned_role)
        db_session.commit()
        db_session.refresh(unassigned_role)
        
        unassigned_role_id = unassigned_role.role_id
        
        # Try to remove the role from all users (should return False since no assignments exist)
        remove_result = remove_role_from_all_users(unassigned_role_id)
        assert remove_result == False
        
        # Verify no changes in database
        query = text("SELECT COUNT(*) FROM users_roles WHERE role_id = :role_id")
        result = db_session.execute(query, {"role_id": unassigned_role_id})
        count = result.scalar()
        assert count == 0

    def test_remove_role_from_all_users_nonexistent_role(self, db_session):
        """Test removing a role that doesn't exist"""
        nonexistent_role_id = 99999
        
        # Try to remove a non-existent role from all users
        remove_result = remove_role_from_all_users(nonexistent_role_id)
        assert remove_result == False

    def test_remove_role_from_all_users_invalid_role_id(self, db_session):
        """Test removing a role with invalid role ID"""
        invalid_role_id = -1
        
        # Try to remove an invalid role from all users
        remove_result = remove_role_from_all_users(invalid_role_id)
        assert remove_result == False

    def test_remove_role_from_all_users_single_user(self, db_session, sample_user_data):
        """Test removing a role that is assigned to only one user"""
        fake = Faker()
        
        # Create a test user
        user = store_user_pending_approval(sample_user_data)
        assert user is not None
        
        # Create a test role
        test_role = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="SingleUserRole",
            role_description="Role assigned to only one user",
        )
        
        db_session.add(test_role)
        db_session.commit()
        db_session.refresh(test_role)
        
        # Store data before session detachment
        test_role_id = test_role.role_id
        user_id = user.id
        
        # Add the role to the user
        add_result = add_user_role(user_id, test_role_id)
        assert add_result == True
        
        # Verify user has the role
        user_roles = get_user_roles(user_id)
        assert len(user_roles) == 1
        
        # Remove the role from all users
        remove_result = remove_role_from_all_users(test_role_id)
        assert remove_result == True
        
        # Verify the role was removed from the user
        user_roles_after = get_user_roles(user_id)
        assert len(user_roles_after) == 0
        
        # Verify by checking database directly
        query = text("SELECT COUNT(*) FROM users_roles WHERE role_id = :role_id")
        result = db_session.execute(query, {"role_id": test_role_id})
        count = result.scalar()
        assert count == 0

    def test_remove_role_from_all_users_multiple_roles_per_user(self, db_session, sample_user_data):
        """Test removing a role when users have multiple roles"""
        fake = Faker()
        
        # Create two test users
        user1_data = sample_user_data.copy()
        user1 = store_user_pending_approval(user1_data)
        
        user2_data = sample_user_data.copy()
        user2_data["id"] = str(fake.random_int(min=100000000000000000, max=999999999999999999))
        user2_data["username"] = fake.user_name()
        user2_data["email"] = fake.email()
        user2 = store_user_pending_approval(user2_data)
        
        assert user1 is not None
        assert user2 is not None
        
        # Create multiple test roles
        role_to_remove = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="AdminRole",
            role_description="Admin role to be removed",
        )
        role_to_keep1 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="UserRole",
            role_description="User role to keep",
        )
        role_to_keep2 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="ModeratorRole",
            role_description="Moderator role to keep",
        )
        
        db_session.add_all([role_to_remove, role_to_keep1, role_to_keep2])
        db_session.commit()
        db_session.refresh(role_to_remove)
        db_session.refresh(role_to_keep1)
        db_session.refresh(role_to_keep2)
        
        # Store data before session detachment
        role_to_remove_id = role_to_remove.role_id
        role_to_keep1_id = role_to_keep1.role_id
        role_to_keep2_id = role_to_keep2.role_id
        user1_id = user1.id
        user2_id = user2.id
        
        # Add multiple roles to both users
        add_result1_admin = add_user_role(user1_id, role_to_remove_id)
        add_result1_user = add_user_role(user1_id, role_to_keep1_id)
        add_result2_admin = add_user_role(user2_id, role_to_remove_id)
        add_result2_mod = add_user_role(user2_id, role_to_keep2_id)
        
        assert add_result1_admin == True
        assert add_result1_user == True
        assert add_result2_admin == True
        assert add_result2_mod == True
        
        # Verify initial setup - both users have multiple roles
        user1_roles = get_user_roles(user1_id)
        user2_roles = get_user_roles(user2_id)
        
        assert len(user1_roles) == 2  # AdminRole and UserRole
        assert len(user2_roles) == 2  # AdminRole and ModeratorRole
        
        # Remove the admin role from all users
        remove_result = remove_role_from_all_users(role_to_remove_id)
        assert remove_result == True
        
        # Verify the admin role was removed but other roles remain
        user1_roles_after = get_user_roles(user1_id)
        user2_roles_after = get_user_roles(user2_id)
        
        assert len(user1_roles_after) == 1  # Only UserRole remains
        assert len(user2_roles_after) == 1  # Only ModeratorRole remains
        
        assert user1_roles_after[0]["role_name"] == "UserRole"
        assert user2_roles_after[0]["role_name"] == "ModeratorRole"
        
        # Verify the admin role was completely removed from the database
        query = text("SELECT COUNT(*) FROM users_roles WHERE role_id = :role_id")
        result = db_session.execute(query, {"role_id": role_to_remove_id})
        count = result.scalar()
        assert count == 0
        
        # Verify other roles still exist in the database
        query_keep1 = text("SELECT COUNT(*) FROM users_roles WHERE role_id = :role_id")
        result_keep1 = db_session.execute(query_keep1, {"role_id": role_to_keep1_id})
        count_keep1 = result_keep1.scalar()
        assert count_keep1 == 1  # UserRole still assigned to user1
        
        query_keep2 = text("SELECT COUNT(*) FROM users_roles WHERE role_id = :role_id")
        result_keep2 = db_session.execute(query_keep2, {"role_id": role_to_keep2_id})
        count_keep2 = result_keep2.scalar()
        assert count_keep2 == 1  # ModeratorRole still assigned to user2

    #######################################
    # Tests get_roles_by_discord_ids()
    #######################################
    
    def test_get_roles_by_discord_ids_success(self, db_session):
        """Test successfully getting roles by Discord IDs"""
        fake = Faker()
        
        # Create multiple test roles
        discord_id1 = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        discord_id2 = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        discord_id3 = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        
        role1 = Role(
            role_discord_id=discord_id1,
            role_name="AdminRole",
            role_description="Administrator role",
        )
        role2 = Role(
            role_discord_id=discord_id2,
            role_name="UserRole",
            role_description="Basic user role",
        )
        role3 = Role(
            role_discord_id=discord_id3,
            role_name="ModeratorRole",
            role_description="Moderator role",
        )
        
        db_session.add_all([role1, role2, role3])
        db_session.commit()
        
        # Test getting roles by Discord IDs
        discord_ids_to_lookup = [discord_id1, discord_id3]  # Skip role2
        result = get_roles_by_discord_ids(discord_ids_to_lookup)
        
        # Should return 2 roles, ordered by role_name (AdminRole comes before ModeratorRole)
        assert len(result) == 2
        
        # Verify first role (AdminRole - alphabetically first)
        assert result[0]["role_discord_id"] == discord_id1
        assert result[0]["role_name"] == "AdminRole"
        assert result[0]["role_description"] == "Administrator role"

        # Verify second role (ModeratorRole)
        assert result[1]["role_discord_id"] == discord_id3
        assert result[1]["role_name"] == "ModeratorRole"
        assert result[1]["role_description"] == "Moderator role"

        # Verify structure of returned dictionaries
        for role in result:
            assert "role_discord_id" in role
            assert "role_name" in role
            assert "role_description" in role

    def test_get_roles_by_discord_ids_empty_list(self, db_session):
        """Test getting roles with an empty Discord IDs list"""
        result = get_roles_by_discord_ids([])
        
        # Should return empty list
        assert isinstance(result, list)
        assert len(result) == 0

    def test_get_roles_by_discord_ids_nonexistent_ids(self, db_session):
        """Test getting roles with Discord IDs that don't exist"""
        fake = Faker()
        
        nonexistent_ids = [
            str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        ]
        
        result = get_roles_by_discord_ids(nonexistent_ids)
        
        # Should return empty list
        assert isinstance(result, list)
        assert len(result) == 0

    def test_get_roles_by_discord_ids_mixed_existing_nonexistent(self, db_session):
        """Test getting roles with mix of existing and non-existing Discord IDs"""
        fake = Faker()
        
        # Create one test role
        existing_discord_id = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        test_role = Role(
            role_discord_id=existing_discord_id,
            role_name="ExistingRole",
            role_description="This role exists",
        )
        
        db_session.add(test_role)
        db_session.commit()
        
        # Mix existing and non-existing Discord IDs
        nonexistent_discord_id = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        mixed_ids = [existing_discord_id, nonexistent_discord_id]
        
        result = get_roles_by_discord_ids(mixed_ids)
        
        # Should return only the existing role
        assert len(result) == 1
        assert result[0]["role_discord_id"] == existing_discord_id
        assert result[0]["role_name"] == "ExistingRole"
        assert result[0]["role_description"] == "This role exists"

    def test_get_roles_by_discord_ids_single_role(self, db_session):
        """Test getting a single role by Discord ID"""
        fake = Faker()
        
        # Create one test role
        discord_id = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        test_role = Role(
            role_discord_id=discord_id,
            role_name="SingleRole",
            role_description="Only role in this test",
        )
        
        db_session.add(test_role)
        db_session.commit()
        
        result = get_roles_by_discord_ids([discord_id])
        
        # Should return exactly one role
        assert len(result) == 1
        assert result[0]["role_discord_id"] == discord_id
        assert result[0]["role_name"] == "SingleRole"
        assert result[0]["role_description"] == "Only role in this test"

    def test_get_roles_by_discord_ids_ordering(self, db_session):
        """Test that roles are returned in alphabetical order by role_name"""
        fake = Faker()
        
        # Create roles with names that will test ordering
        discord_ids = [
            str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20] for _ in range(4)
        ]
        
        # Create roles in non-alphabetical order
        roles = [
            Role(
                role_discord_id=discord_ids[0],
                role_name="ZebraRole",  # Last alphabetically
                role_description="Z role",
            ),
            Role(
                role_discord_id=discord_ids[1],
                role_name="AlphaRole",  # First alphabetically
                role_description="A role",
            ),
            Role(
                role_discord_id=discord_ids[2],
                role_name="BetaRole",   # Second alphabetically
                role_description="B role",
            ),
            Role(
                role_discord_id=discord_ids[3],
                role_name="GammaRole", # Third alphabetically
                role_description="G role",
            )
        ]
        
        db_session.add_all(roles)
        db_session.commit()
        
        result = get_roles_by_discord_ids(discord_ids)
        
        # Should return all 4 roles in alphabetical order
        assert len(result) == 4
        assert result[0]["role_name"] == "AlphaRole"
        assert result[1]["role_name"] == "BetaRole"
        assert result[2]["role_name"] == "GammaRole"
        assert result[3]["role_name"] == "ZebraRole"

    def test_get_roles_by_discord_ids_duplicate_ids(self, db_session):
        """Test getting roles with duplicate Discord IDs in the input list"""
        fake = Faker()
        
        # Create one test role
        discord_id = str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20]
        test_role = Role(
            role_discord_id=discord_id,
            role_name="DuplicateTestRole",
            role_description="Role for duplicate ID testing",
        )
        
        db_session.add(test_role)
        db_session.commit()
        
        # Pass the same Discord ID multiple times
        duplicate_ids = [discord_id, discord_id, discord_id]
        
        result = get_roles_by_discord_ids(duplicate_ids)
        
        # Should return only one role (not duplicated)
        assert len(result) == 1
        assert result[0]["role_discord_id"] == discord_id
        assert result[0]["role_name"] == "DuplicateTestRole"
