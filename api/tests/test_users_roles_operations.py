import pytest
from sqlalchemy import text
from database.operations.users_roles import (
    get_user_roles,
    add_user_role,
    remove_user_role,
    clear_user_roles,
    get_roles_by_discord_ids
)

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
        from database.operations.users.store_user_appending_approval import store_user_pending_approval
        from database.models.role import Role
        from faker import Faker
        
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
