import { useState, useEffect } from 'react';
import {
  Table, Select, Button,
  Group, Text, Stack, Menu,
  Modal, MultiSelect,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconTrash } from '@tabler/icons-react';
import type { User, UserRole } from '../../types/user';
import type { Role } from '../../types/role';
import { userService } from '../../services/admin/userService';
import { roleService } from '../../services/admin/roleService';
import { tableStyles, modalStyles, inputStyles, menuStyles } from '../../styles/mantine';

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending',  label: 'Pending'  },
  { value: 'rejected', label: 'Rejected' },
  { value: 'banned',   label: 'Banned'   },
];

const statusSelectStyles = {
  input: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    height: 'auto',
    minHeight: 'auto',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

const UserManagement = () => {
  const [users, setUsers]       = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const navigate = useNavigate();

  const [editingUser, setEditingUser]         = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [modalError, setModalError]           = useState<string | null>(null);
  const [rolesModalOpen, { open: openRoles, close: closeRoles }] = useDisclosure(false);

  useEffect(() => {
    Promise.all([userService.getAllUsers(), roleService.getAllRoles()])
      .then(([u, r]) => { setUsers(u); setAllRoles(r); })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (userId: number, status: string) => {
    try {
      const updated = await userService.updateUser(userId, { status: status as User['status'] });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: updated.status } : u));
    } catch {
      setError('Failed to update status.');
    }
  };

  const openEditRoles = (user: User) => {
    setEditingUser(user);
    setModalError(null);
    setSelectedRoleIds(
      user.roles.map((ur) => {
        const match = allRoles.find((r) => r.role_name === ur.role_name);
        return match ? String(match.role_id) : '';
      }).filter(Boolean)
    );
    openRoles();
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    setModalError(null);
    try {
      const { roles: updatedRoles, warning } = await userService.setUserRoles(
        editingUser.id,
        selectedRoleIds.map(Number)
      );
      setUsers((prev) =>
        prev.map((u) => u.id === editingUser.id ? { ...u, roles: updatedRoles as UserRole[] } : u)
      );
      closeRoles();
      if (warning) setError(warning);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update roles.');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to delete user.');
    }
  };

  const roleSelectData = allRoles.map((r) => ({
    value: String(r.role_id),
    label: r.role_name,
  }));

  if (loading) return <Text c="var(--naja-gold)">Loading users...</Text>;

  return (
    <Stack gap="md">
      <h1 style={{ margin: 0 }}>User Management</h1>

      {error && <Text c="red">{error}</Text>}

      {/* Edit Roles Modal */}
      <Modal
        opened={rolesModalOpen}
        onClose={closeRoles}
        title={
          <Text c="var(--naja-gold)" fw={700}>
            Edit Roles — {editingUser?.discord_username}
          </Text>
        }
        styles={modalStyles}
      >
        <Stack gap="md">
          <Text size="sm" c="var(--naja-teal)">
            Note: roles are synced from Discord on each login and may be overwritten.
          </Text>
          <MultiSelect
            label="Assigned Roles"
            data={roleSelectData}
            value={selectedRoleIds}
            onChange={setSelectedRoleIds}
            styles={inputStyles}
          />
          {modalError && <Text size="sm" c="red">{modalError}</Text>}
          <Group justify="flex-end">
            <Button variant="outline" color="gray" onClick={closeRoles}>Cancel</Button>
            <Button color="najaGold" onClick={handleSaveRoles}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      <Table striped highlightOnHover styles={tableStyles}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th style={{ width: 130 }}>Status</Table.Th>
            <Table.Th visibleFrom="sm">Roles</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.id}>

              <Table.Td style={{ width: 330 }}>
                <Group gap="sm">
                  <Stack gap={2}>
                    <Text size="sm" fw={600} c="var(--naja-text)">
                      {user.server_nickname || user.global_name || user.discord_username}
                    </Text>
                  </Stack>
                </Group>
              </Table.Td>

              <Table.Td style={{ width: 150 }}>
                <Select
                  data={STATUS_OPTIONS}
                  value={user.status}
                  onChange={(val) => val && handleStatusChange(user.id, val)}
                  size="xs"
                  styles={{
                    ...statusSelectStyles,
                    input: {
                      ...statusSelectStyles.input,
                      color: user.status === 'approved' ? 'var(--naja-gold)'
                           : user.status === 'pending'  ? 'var(--naja-teal)'
                           : user.status === 'rejected' ? '#ff6b6b'
                           : '#888',
                    },
                  }}
                />
              </Table.Td>

              <Table.Td visibleFrom="sm">
                <Text
                  size="sm"
                  c="var(--naja-text)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openEditRoles(user)}
                >
                  {user.roles.length > 0
                    ? user.roles.map((r) => r.role_name).join(', ')
                    : <Text size="xs" c="dimmed">—</Text>
                  }
                </Text>
              </Table.Td>

              <Table.Td>
                <Menu position="bottom-end" withArrow arrowSize={8} styles={menuStyles}>
                  <Menu.Target>
                    <Button variant="subtle" color="gray" size="xs" px={6}>
                      ...
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconUser size={14} stroke={1.5} />}
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      View Profile
                    </Menu.Item>
                    <Menu.Divider style={{ borderColor: 'rgba(204, 172, 49, 0.2)' }} />
                    <Menu.Item
                      leftSection={<IconTrash size={14} stroke={1.5} />}
                      onClick={() => handleDelete(user.id)}
                      styles={{ item: { ...menuStyles.item, color: '#ff6b6b' } }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>

            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {users.length === 0 && <Text c="var(--naja-text)">No users found.</Text>}
    </Stack>
  );
};

export default UserManagement;
