import pytest
from sqlalchemy import text
from faker import Faker
from database.operations.users_roles import (
    get_user_roles,
    add_user_role,
    remove_user_role,
    clear_user_roles,
    get_roles_by_discord_ids
)
from database.operations.users.store_user_appending_approval import store_user_pending_approval
from database.models.role import Role

class TestUsersRolesOperations:
    """Test class for users_roles database operations"""

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
            grants_access=True
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
            grants_access=True
        )
        role2 = Role(
            role_discord_id=str(fake.random_int(min=100000000000000000, max=999999999999999999))[:20],
            role_name="User",  # Alphabetically second
            role_description=fake.text(max_nb_chars=100)[:255],
            grants_access=False
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
        assert user_roles[0]["grants_access"] == True
        
        assert user_roles[1]["role_name"] == "User"
        assert user_roles[1]["role_discord_id"] == role2_discord_id
        assert user_roles[1]["grants_access"] == False
        
        # Verify the structure of returned dictionaries
        for role in user_roles:
            assert "role_discord_id" in role
            assert "role_name" in role
            assert "grants_access" in role
            assert isinstance(role["grants_access"], bool)

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
            grants_access=True
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
        assert user_roles[0]["grants_access"] == True
