"""
Tests for user operations
"""
import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from database.operations.users import (
    store_user_pending_approval,
    get_user_by_id,
    get_user_by_discord_id,
    get_server_nickname_by_user_id,
    is_user_approved,
    update_user_discord_info
)
from database.models.user import User, UserStatus
from database.models.role import Role
from routes.auth.discord_oauth import discord_callback


def test_store_user_pending_approval(db_session, sample_user_data):
    """Test storing user data pending approval"""
    user = store_user_pending_approval(sample_user_data)

    assert user is not None
    assert user.discord_id == sample_user_data["id"]
    assert user.discord_username == sample_user_data["username"]
    assert user.server_nickname == sample_user_data["server_nickname"]
    assert user.email == sample_user_data["email"]
    assert user.status == UserStatus.PENDING


def test_get_user_by_id(db_session, sample_user_data):
    """Test retrieving a user by ID"""
    # First store the user
    user = store_user_pending_approval(sample_user_data)

    # Retrieve by ID
    retrieved_user = get_user_by_id(user.id)

    assert retrieved_user is not None
    assert retrieved_user.discord_id == sample_user_data["id"]


def test_get_user_by_discord_id(db_session, sample_user_data):
    """Test retrieving a user by Discord ID"""
    # First store the user
    user = store_user_pending_approval(sample_user_data)

    # Retrieve by Discord ID
    retrieved_user = get_user_by_discord_id(sample_user_data["id"])
    
    assert retrieved_user is not None
    assert retrieved_user.id == user.id

def test_get_server_nickname_by_user_id(db_session, sample_user_data):
    """Test retrieving a user's server nickname by user ID"""
    # First store the user
    user = store_user_pending_approval(sample_user_data)

    # Retrieve server nickname by user ID
    server_nickname = get_server_nickname_by_user_id(user.id)

    assert server_nickname is not None
    assert server_nickname == sample_user_data["server_nickname"]


def test_get_server_nickname_by_user_id_nonexistent(db_session):
    """Test retrieving server nickname for non-existent user"""
    nickname = get_server_nickname_by_user_id(99999)  # ID that doesn't exist
    assert nickname is None


def test_get_server_nickname_by_user_id_no_nickname(db_session, sample_user_data):
    """Test retrieving server nickname when user has no nickname set"""
    # Create user data without server nickname
    user_data_no_nickname = sample_user_data.copy()
    user_data_no_nickname["server_nickname"] = None
    
    # Store the user
    user = store_user_pending_approval(user_data_no_nickname)
    
    # Retrieve server nickname
    server_nickname = get_server_nickname_by_user_id(user.id)
    
    assert server_nickname is None


def test_is_user_approved_with_real_users(db_session, sample_user_data):
    """Test checking if a user is approved using real database users"""
    # Create a pending user (default status)
    pending_user = store_user_pending_approval(sample_user_data)
    assert is_user_approved(pending_user) is False
    
    # Manually set user to approved status and test
    pending_user.status = UserStatus.APPROVED
    db_session.commit()
    assert is_user_approved(pending_user) is True
    
    # Test rejected user
    pending_user.status = UserStatus.REJECTED
    db_session.commit()
    assert is_user_approved(pending_user) is False
    
    # Test banned user
    pending_user.status = UserStatus.BANNED
    db_session.commit()
    assert is_user_approved(pending_user) is False


def test_is_user_approved_edge_cases():
    """Test edge cases for is_user_approved function"""
    # Test with None user
    assert is_user_approved(None) is False


def test_get_user_by_id_nonexistent(db_session):
    """Test retrieving a non-existent user by ID"""
    user = get_user_by_id(99999)  # ID that doesn't exist
    assert user is None


def test_get_user_by_discord_id_nonexistent(db_session):
    """Test retrieving a non-existent user by Discord ID"""
    user = get_user_by_discord_id("999999999999999999")  # Discord ID that doesn't exist
    assert user is None


def test_store_user_duplicate_discord_id(db_session, sample_user_data):
    """Test storing a user with duplicate Discord ID (should fail)"""
    # Store first user
    user1 = store_user_pending_approval(sample_user_data)
    assert user1 is not None

    # Try to store another user with same Discord ID
    user2 = store_user_pending_approval(sample_user_data)
    assert user2 is None  # Should fail due to unique constraint


def test_store_user_missing_data(db_session):
    """Test storing user with missing required data"""
    incomplete_data = {
        "username": "testuser",
        # Missing 'id' (Discord ID) which is required
        "email": "test@example.com"
    }
    
    user = store_user_pending_approval(incomplete_data)
    # This should either fail or handle gracefully
    # The exact behavior depends on your database constraints

def test_update_user_discord_info(db_session, sample_user_data):
    """Test updating Discord-related information for a user"""
    # First store the user
    user = store_user_pending_approval(sample_user_data)

    # Prepare new Discord data
    new_discord_data = {
        "username": "updateduser",
        "email": "updated@example.com",
        "server_nickname": "Updated Nickname"
    }

    # Update the user with new Discord data
    success = update_user_discord_info(user.id, new_discord_data)
    assert success is True

    # Retrieve the updated user and check the changes
    updated_user = get_user_by_id(user.id)
    assert updated_user is not None
    assert updated_user.discord_username == new_discord_data["username"]
    assert updated_user.email == new_discord_data["email"]  # Fixed field name
    assert updated_user.server_nickname == new_discord_data["server_nickname"]


def test_discord_oauth_detects_user_changes(db_session, sample_user_data):
    """Test that Discord OAuth flow detects and handles existing user data changes"""
    # Create a role that grants access for the OAuth flow
    access_role = Role(
        role_discord_id="fake_role_id",
        role_name="Access Role",
        role_description="Test role that grants access",
        grants_access=True
    )
    db_session.add(access_role)
    db_session.commit()
    
    # First, create an existing user with original data
    original_user = store_user_pending_approval(sample_user_data)
    
    # Mark user as approved so they can login
    original_user.status = UserStatus.APPROVED
    db_session.commit()
    
    # Simulate updated Discord data (what Discord would return after user changes info)
    updated_discord_data = {
        "id": sample_user_data["id"],  # Same Discord ID
        "username": "new_username",    # Changed username
        "email": "new_email@example.com",  # Changed email
        "server_nickname": "New Server Nickname",  # Will be added from guild member info
    }
    
    # Simulate updated server nickname from guild member info
    updated_guild_member_info = {
        "nickname": "New Server Nickname",  # Changed server nickname
        "roles": ["fake_role_id"],
        "is_member": True,
        "has_required_role": True
    }
    
    # Mock the Discord API calls
    with patch('routes.auth.discord_oauth.exchange_code_for_token') as mock_exchange, \
         patch('routes.auth.discord_oauth.get_discord_user_info') as mock_get_user, \
         patch('routes.auth.discord_oauth.get_discord_user_guilds') as mock_get_guilds, \
         patch('routes.auth.discord_oauth.is_member_of_target_guild') as mock_is_member, \
         patch('routes.auth.discord_oauth.check_user_guild_roles') as mock_check_roles:
        
        # Configure mocks
        mock_exchange.return_value = {"access_token": "fake_token"}
        mock_get_user.return_value = updated_discord_data
        mock_get_guilds.return_value = [{"id": "fake_guild", "name": "Test Guild"}]
        mock_is_member.return_value = (True, "fake_guild")
        mock_check_roles.return_value = updated_guild_member_info
        
        # Simulate the OAuth callback
        response = asyncio.run(discord_callback(code="fake_code"))
        
        # Check if user data was updated in the database
        updated_user = get_user_by_discord_id(sample_user_data["id"])
        
        # The Discord OAuth flow DOES update existing user data
        # This test confirms that the update logic is working
        assert updated_user.discord_username == updated_discord_data["username"]
        assert updated_user.email == updated_discord_data["email"]
        assert updated_user.server_nickname == updated_guild_member_info["nickname"]
