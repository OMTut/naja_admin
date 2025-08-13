import pytest
from unittest.mock import patch, MagicMock
from services.sync_user_roles import sync_user_roles, get_user_current_roles
from services.role_access import check_user_has_access_role, get_user_access_roles
from faker import Faker

fake = Faker()

@pytest.mark.database
class TestSyncUserRolesService:
    """Test class for sync_user_roles service layer functions"""

    def test_sync_user_roles_no_discord_roles_clears_all(self):
        """Test that syncing with no Discord roles clears all user roles"""
        user_id = 123
        
        with patch('services.sync_user_roles.clear_user_roles') as mock_clear:
            mock_clear.return_value = True
            
            result = sync_user_roles(user_id, [])
            
            mock_clear.assert_called_once_with(user_id)
            assert result == True

    def test_sync_user_roles_success(self):
        """Test successful role synchronization"""
        user_id = 123
        discord_roles = ["discord_id_1", "discord_id_2"]
        
        mock_roles_data = [
            {"role_discord_id": "discord_id_1", "role_name": "Admin", "grants_access": True},
            {"role_discord_id": "discord_id_2", "role_name": "User", "grants_access": False}
        ]
        
        with patch('services.sync_user_roles.get_roles_by_discord_ids') as mock_get_roles, \
             patch('services.sync_user_roles.clear_user_roles') as mock_clear, \
             patch('services.sync_user_roles.get_user_roles') as mock_get_user_roles, \
             patch('database.operations.role_operations.getRoleIdByDiscordId') as mock_get_role_id, \
             patch('services.sync_user_roles.add_user_role') as mock_add_role:
            
            mock_get_roles.return_value = mock_roles_data
            mock_clear.return_value = True
            mock_get_user_roles.return_value = []  # User has no roles after clear
            mock_get_role_id.side_effect = [1, 2]  # Return role IDs
            mock_add_role.return_value = True
            
            result = sync_user_roles(user_id, discord_roles)
            
            assert result == True
            mock_get_roles.assert_called_once_with(discord_roles)
            mock_clear.assert_called_once_with(user_id)
            assert mock_add_role.call_count == 2

    def test_sync_user_roles_partial_failure(self):
        """Test role synchronization with partial failures"""
        user_id = 123
        discord_roles = ["discord_id_1", "discord_id_2"]
        
        mock_roles_data = [
            {"role_discord_id": "discord_id_1", "role_name": "Admin", "grants_access": True},
            {"role_discord_id": "discord_id_2", "role_name": "User", "grants_access": False}
        ]
        
        with patch('services.sync_user_roles.get_roles_by_discord_ids') as mock_get_roles, \
             patch('services.sync_user_roles.clear_user_roles') as mock_clear, \
             patch('services.sync_user_roles.get_user_roles') as mock_get_user_roles, \
             patch('database.operations.role_operations.getRoleIdByDiscordId') as mock_get_role_id, \
             patch('services.sync_user_roles.add_user_role') as mock_add_role:
            
            mock_get_roles.return_value = mock_roles_data
            mock_clear.return_value = True
            mock_get_user_roles.return_value = []
            mock_get_role_id.side_effect = [1, None]  # Second role ID lookup fails
            mock_add_role.return_value = True
            
            result = sync_user_roles(user_id, discord_roles)
            
            assert result == False  # Should return False due to partial failure

    def test_get_user_current_roles_success(self):
        """Test getting current user roles with service layer formatting"""
        user_id = 123
        
        mock_basic_roles = [
            {"role_discord_id": "123", "role_name": "Admin", "grants_access": True},
            {"role_discord_id": "456", "role_name": "User", "grants_access": False}
        ]
        
        with patch('services.sync_user_roles.get_user_roles') as mock_get_roles:
            mock_get_roles.return_value = mock_basic_roles
            
            result = get_user_current_roles(user_id)
            
            expected = [
                {"discord_id": "123", "name": "Admin", "grants_access": True},
                {"discord_id": "456", "name": "User", "grants_access": False}
            ]
            
            assert result == expected
            mock_get_roles.assert_called_once_with(user_id)

    def test_get_user_current_roles_error_handling(self):
        """Test error handling in get_user_current_roles"""
        user_id = 123
        
        with patch('services.sync_user_roles.get_user_roles') as mock_get_roles:
            mock_get_roles.side_effect = Exception("Database error")
            
            result = get_user_current_roles(user_id)
            
            assert result == []


@pytest.mark.database
class TestRoleAccessService:
    """Test class for role_access service layer functions"""

    def test_check_user_has_access_role_success(self):
        """Test successful access role check"""
        discord_role_ids = ["role_1", "role_2"]
        
        mock_roles = [
            {"role_discord_id": "role_1", "role_name": "Admin", "grants_access": True},
            {"role_discord_id": "role_2", "role_name": "User", "grants_access": False}
        ]
        
        with patch('services.role_access.get_roles_by_discord_ids') as mock_get_roles:
            mock_get_roles.return_value = mock_roles
            
            result = check_user_has_access_role(discord_role_ids)
            
            assert result == True
            mock_get_roles.assert_called_once_with(discord_role_ids)

    def test_check_user_has_access_role_no_access(self):
        """Test access check when no roles grant access"""
        discord_role_ids = ["role_1", "role_2"]
        
        mock_roles = [
            {"role_discord_id": "role_1", "role_name": "User", "grants_access": False},
            {"role_discord_id": "role_2", "role_name": "Guest", "grants_access": False}
        ]
        
        with patch('services.role_access.get_roles_by_discord_ids') as mock_get_roles:
            mock_get_roles.return_value = mock_roles
            
            result = check_user_has_access_role(discord_role_ids)
            
            assert result == False

    def test_check_user_has_access_role_empty_roles(self):
        """Test access check with no Discord roles"""
        result = check_user_has_access_role([])
        assert result == False

    def test_check_user_has_access_role_error_handling(self):
        """Test error handling in access role check"""
        discord_role_ids = ["role_1"]
        
        with patch('services.role_access.get_roles_by_discord_ids') as mock_get_roles:
            mock_get_roles.side_effect = Exception("Database error")
            
            result = check_user_has_access_role(discord_role_ids)
            
            assert result == False

    def test_get_user_access_roles_success(self):
        """Test getting user access roles with proper sorting"""
        discord_role_ids = ["role_1", "role_2", "role_3"]
        
        mock_roles = [
            {"role_discord_id": "role_1", "role_name": "User", "role_description": "Basic user", "grants_access": False},
            {"role_discord_id": "role_2", "role_name": "Admin", "role_description": "Administrator", "grants_access": True},
            {"role_discord_id": "role_3", "role_name": "Moderator", "role_description": "Moderator", "grants_access": True}
        ]
        
        with patch('services.role_access.get_roles_by_discord_ids') as mock_get_roles:
            mock_get_roles.return_value = mock_roles
            
            result = get_user_access_roles(discord_role_ids)
            
            # Should be sorted by grants_access (True first) then by role_name
            expected = [
                {"discord_id": "role_2", "name": "Admin", "description": "Administrator", "grants_access": True},
                {"discord_id": "role_3", "name": "Moderator", "description": "Moderator", "grants_access": True},
                {"discord_id": "role_1", "name": "User", "description": "Basic user", "grants_access": False}
            ]
            
            assert result == expected

    def test_get_user_access_roles_empty(self):
        """Test getting access roles with empty input"""
        result = get_user_access_roles([])
        assert result == []

    def test_get_user_access_roles_error_handling(self):
        """Test error handling in get_user_access_roles"""
        discord_role_ids = ["role_1"]
        
        with patch('services.role_access.get_roles_by_discord_ids') as mock_get_roles:
            mock_get_roles.side_effect = Exception("Database error")
            
            result = get_user_access_roles(discord_role_ids)
            
            assert result == []
