import { useState, useEffect } from 'react';
import {
  Select, Button, Group, Text, Stack, Box, Drawer, MultiSelect,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUser, IconTrash } from '@tabler/icons-react';
import type { User, UserRole } from '../../types/user';
import type { Role } from '../../types/role';
import { userService } from '../../services/admin/userService';
import { roleService } from '../../services/admin/roleService';
import { drawerStyles, inputStyles } from '../../styles/mantine';
import UserProfileDrawer from './UserProfileDrawer';

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending',  label: 'Pending'  },
  { value: 'rejected', label: 'Rejected' },
  { value: 'banned',   label: 'Banned'   },
];


const statusColor = (s: User['status']) =>
  s === 'approved' ? 'var(--naja-gold)'
  : s === 'pending'  ? 'var(--naja-teal)'
  : s === 'rejected' ? '#ff6b6b'
  : '#888';

const displayName = (user: User) =>
  user.server_nickname || user.global_name || user.discord_username;

const UserManagement = () => {
  const [users,    setUsers]    = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Edit drawer
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingUser,    setEditingUser]    = useState<User | null>(null);
  const [editStatus,     setEditStatus]     = useState<User['status']>('pending');
  const [editRoleIds,    setEditRoleIds]    = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError,      setEditError]      = useState<string | null>(null);
  const [confirmDelete,    setConfirmDelete]    = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Profile drawer
  const [profileOpen, { open: openProfile, close: closeProfile }] = useDisclosure(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([userService.getAllUsers(), roleService.getAllRoles()])
      .then(([u, r]) => { setUsers(u); setAllRoles(r); })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const roleSelectData = allRoles.map(r => ({ value: String(r.role_id), label: r.role_name }));

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditStatus(user.status);
    setEditRoleIds(
      user.roles
        .map(ur => allRoles.find(r => r.role_name === ur.role_name))
        .filter(Boolean)
        .map(r => String(r!.role_id))
    );
    setEditError(null);
    setConfirmDelete(false);
    openEdit();
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setEditSubmitting(true); setEditError(null);
    try {
      const statusUpdated = await userService.updateUser(editingUser.id, { status: editStatus });
      const { roles: updatedRoles, warning } = await userService.setUserRoles(
        editingUser.id,
        editRoleIds.map(Number)
      );
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, status: statusUpdated.status, roles: updatedRoles as UserRole[] }
          : u
      ));
      closeEdit();
      if (warning) setError(warning);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    setDeleteSubmitting(true);
    try {
      await userService.deleteUser(editingUser.id);
      setUsers(prev => prev.filter(u => u.id !== editingUser.id));
      closeEdit();
    } catch {
      setEditError('Failed to delete user.');
      setDeleteSubmitting(false);
    }
  };

  const startProfile = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileUserId(user.id);
    openProfile();
  };

  if (loading) return <Text c="var(--naja-gold)">Loading users...</Text>;

  return (
    <Stack gap="md">
      <h1 style={{ margin: 0 }}>User Management</h1>

      {error && <Text c="red">{error}</Text>}

      {users.length === 0 ? (
        <Text c="var(--naja-text)">No users found.</Text>
      ) : (
        <Stack gap={0}>
          {/* ── Column headers (desktop only) ───────────────────────────────────── */}
          <Group gap="md" px="sm" pb="xs" visibleFrom="sm" style={{ borderBottom: '1px solid rgba(204,172,49,0.3)' }}>
            <Box style={{ flex: 3 }}>
              <Text size="xs" fw={700} tt="uppercase" c="var(--naja-gold)" style={{ letterSpacing: '0.05em' }}>User</Text>
            </Box>
            <Box style={{ flex: 2 }}>
              <Text size="xs" fw={700} tt="uppercase" c="var(--naja-gold)" style={{ letterSpacing: '0.05em' }}>Status</Text>
            </Box>
            <Box style={{ flex: 3 }}>
              <Text size="xs" fw={700} tt="uppercase" c="var(--naja-gold)" style={{ letterSpacing: '0.05em' }}>Roles</Text>
            </Box>
            <Box style={{ width: 110 }} />
          </Group>

          {/* ── Mobile divider ──────────────────────────────────────────────────── */}
          <Box hiddenFrom="sm" style={{ borderBottom: '1px solid rgba(204,172,49,0.3)', marginBottom: 2 }} />

          {users.map((user, idx) => (
            <Box
              key={user.id}
              px="sm"
              py="xs"
              className="inventory-row"
              style={{
                backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => startEdit(user)}
            >
              {/* Desktop layout */}
              <Group gap="md" align="center" wrap="nowrap" visibleFrom="sm">
                <Box style={{ flex: 3, minWidth: 0 }}>
                  <Text size="md" fw={600} c="var(--naja-text)" truncate>{displayName(user)}</Text>
                  <Text size="xs" c="dimmed" truncate>{user.discord_username}</Text>
                </Box>
                <Box style={{ flex: 2 }}>
                  <Text size="sm" fw={600} style={{ color: statusColor(user.status) }}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Text>
                </Box>
                <Box style={{ flex: 3, minWidth: 0 }}>
                  <Text size="sm" c="dimmed" truncate>
                    {user.roles.length > 0 ? user.roles.map(r => r.role_name).join(', ') : '—'}
                  </Text>
                </Box>
                <Button
                  variant="default"
                  size="md"
                  leftSection={<IconUser size={14} />}
                  className="filter-btn"
                  onClick={e => startProfile(user, e)}
                >
                  View Profile
                </Button>
              </Group>

              {/* Mobile layout */}
              <Group gap="sm" align="center" wrap="nowrap" hiddenFrom="sm">
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="md" fw={600} c="var(--naja-text)" truncate>{displayName(user)}</Text>
                  <Group gap="xs">
                    <Text size="xs" fw={600} style={{ color: statusColor(user.status) }}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Text>
                    {user.roles.length > 0 && (
                      <Text size="xs" c="dimmed" truncate>· {user.roles.map(r => r.role_name).join(', ')}</Text>
                    )}
                  </Group>
                </Stack>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<IconUser size={14} />}
                  className="filter-btn"
                  onClick={e => startProfile(user, e)}
                >
                  View Profile
                </Button>
              </Group>
            </Box>
          ))}
        </Stack>
      )}

      {/* ── Edit Drawer ─────────────────────────────────────────────────────────── */}
      <Drawer
        opened={editOpen}
        onClose={closeEdit}
        title={
          <Text fw={700} c="var(--naja-gold)" tt="uppercase" size="md" style={{ letterSpacing: '0.05em' }}>
            {editingUser ? displayName(editingUser) : ''}
          </Text>
        }
        position="right"
        size="lg"
        styles={drawerStyles}
      >
        <Stack gap="md" pt="xs">
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={editStatus}
            onChange={val => val && setEditStatus(val as User['status'])}
            styles={inputStyles}
          />
          <MultiSelect
            label="Roles"
            data={roleSelectData}
            value={editRoleIds}
            onChange={setEditRoleIds}
            styles={inputStyles}
          />
          <Text size="xs" c="var(--naja-teal)">
            Roles are synced from Discord on each login and may be overwritten.
          </Text>

          <Divider color="rgba(204,172,49,0.15)" />

          {editError && <Text size="sm" c="red">{editError}</Text>}

          {confirmDelete ? (
            <Stack gap="xs">
              <Text size="sm" c="var(--naja-text)">
                Delete{' '}
                <Text span fw={700} c="var(--naja-gold)">
                  {editingUser ? displayName(editingUser) : ''}
                </Text>
                ? This cannot be undone.
              </Text>
              <Group gap="xs">
                <Button size="compact-sm" variant="default" className="delete-btn" onClick={handleDelete} loading={deleteSubmitting}>
                  Confirm
                </Button>
                <Button size="compact-sm" variant="subtle" color="gray" onClick={() => setConfirmDelete(false)} disabled={deleteSubmitting}>
                  Cancel
                </Button>
              </Group>
            </Stack>
          ) : (
            <Group justify="space-between">
              <Button
                variant="default"
                className="delete-btn"
                size="sm"
                leftSection={<IconTrash size={14} />}
                onClick={() => setConfirmDelete(true)}
                disabled={editSubmitting}
              >
                Delete User
              </Button>
              <Group gap="xs" justify="space-between">
                <Button variant="subtle" color="gray" onClick={closeEdit} disabled={editSubmitting}>Cancel</Button>
                <Button variant="outline" color="najaGold" onClick={handleSave} loading={editSubmitting}>Save</Button>
              </Group>
            </Group>
          )}
        </Stack>
      </Drawer>

      <UserProfileDrawer
        opened={profileOpen}
        onClose={closeProfile}
        userId={profileUserId}
      />
    </Stack>
  );
};

export default UserManagement;
