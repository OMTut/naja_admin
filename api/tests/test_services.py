import pytest
from unittest.mock import patch, MagicMock
from services.sync_user_roles import sync_user_roles, get_user_current_roles
from services.role_access import check_site_access, check_user_has_permission
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
            {"role_discord_id": "discord_id_1", "role_name": "Admin"},
            {"role_discord_id": "discord_id_2", "role_name": "User"}
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
            {"role_discord_id": "discord_id_1", "role_name": "Admin"},
            {"role_discord_id": "discord_id_2", "role_name": "User"}
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
            {"role_discord_id": "123", "role_name": "Admin"},
            {"role_discord_id": "456", "role_name": "User"}
        ]

        with patch('services.sync_user_roles.get_user_roles') as mock_get_roles:
            mock_get_roles.return_value = mock_basic_roles

            result = get_user_current_roles(user_id)

            expected = [
                {"discord_id": "123", "name": "Admin"},
                {"discord_id": "456", "name": "User"}
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

    def test_check_site_access_granted(self):
        """Test site access check when a role has site_access permission"""
        discord_role_ids = ["role_1", "role_2"]

        with patch('services.role_access.discord_roles_have_permission') as mock_check:
            mock_check.return_value = True

            result = check_site_access(discord_role_ids)

            assert result == True
            mock_check.assert_called_once_with(discord_role_ids, "site_access")

    def test_check_site_access_denied(self):
        """Test site access check when no role has site_access permission"""
        discord_role_ids = ["role_1", "role_2"]

        with patch('services.role_access.discord_roles_have_permission') as mock_check:
            mock_check.return_value = False

            result = check_site_access(discord_role_ids)

            assert result == False

    def test_check_site_access_empty_roles(self):
        """Test site access check with no Discord roles"""
        result = check_site_access([])
        assert result == False

    def test_check_site_access_error_handling(self):
        """Test error handling in check_site_access"""
        discord_role_ids = ["role_1"]

        with patch('services.role_access.discord_roles_have_permission') as mock_check:
            mock_check.side_effect = Exception("Database error")

            result = check_site_access(discord_role_ids)

            assert result == False

    def test_check_user_has_permission_granted(self):
        """Test permission check when user has the permission"""
        with patch('services.role_access.get_user_permissions') as mock_perms:
            mock_perms.return_value = {"admin", "inventory"}

            result = check_user_has_permission(1, "admin")

            assert result == True

    def test_check_user_has_permission_denied(self):
        """Test permission check when user lacks the permission"""
        with patch('services.role_access.get_user_permissions') as mock_perms:
            mock_perms.return_value = {"site_access"}

            result = check_user_has_permission(1, "admin")

            assert result == False

    def test_check_user_has_permission_error_handling(self):
        """Test error handling in check_user_has_permission"""
        with patch('services.role_access.get_user_permissions') as mock_perms:
            mock_perms.side_effect = Exception("Database error")

            result = check_user_has_permission(1, "admin")

            assert result == False
