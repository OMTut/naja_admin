import { useState, useEffect } from 'react';
import {
  Drawer, Stack, Group, Text, Button, Box, Select,
  TextInput, MultiSelect, Divider, ActionIcon, Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { drawerClassNames, inputStyles, displayRows } from '../../styles/mantine';
import type { Role, RoleCreate, RoleUpdate } from '../../types/role';
import { roleService } from '../../services/admin/roleService';
import { permissionService } from '../../services/admin/permissionService';

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filter, setFilter] = useState<'discord' | 'application' | null>(null);

  // Add drawer
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [addData, setAddData] = useState<RoleCreate>({
    role_discord_id: '',
    role_name: '',
    role_description: '',
    permissions: [],
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit drawer
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editData, setEditData] = useState<RoleUpdate>({});
  const [editSubmit, setEditSubmit] = useState(false);
  const [editError, setEditError] = useState('');

  // Permissions list for MultiSelect
  const [permissionOptions, setPermissionOptions] = useState<{ value: string; label: string }[]>([]);

  // Inline delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSubmit, setDeleteSubmit] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadRoles();
    permissionService.getAllPermissions()
      .then(perms => setPermissionOptions(perms.map(p => ({ value: p.name, label: p.name }))))
      .catch(() => {});
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAllRoles();
      setRoles(data);
      setError(null);
    } catch {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  // ── Add ──────────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addData.role_name?.trim()) { setAddError('Role name is required.'); return; }
    setAddSubmitting(true); setAddError('');
    try {
      await roleService.createRole({
        ...addData,
        role_discord_id: addData.role_discord_id?.trim() || undefined,
        role_name: addData.role_name.trim(),
        role_description: addData.role_description?.trim() || undefined,
      });
      closeAdd();
      setAddData({ role_discord_id: '', role_name: '', role_description: '', permissions: [] });
      loadRoles();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create role.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setEditData({
      role_name: role.role_name,
      role_description: role.role_description || '',
      permissions: role.permissions,
    });
    setEditError('');
    setDeleteId(null);
    openEdit();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    if (!editData.role_name?.trim()) { setEditError('Role name is required.'); return; }
    setEditSubmit(true); setEditError('');
    try {
      await roleService.updateRole(editingRole.role_id, {
        ...editData,
        role_name: editData.role_name?.trim(),
        role_description: editData.role_description?.trim() || undefined,
      });
      closeEdit();
      loadRoles();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update role.');
    } finally {
      setEditSubmit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const startDelete = (role: Role) => {
    setDeleteId(role.role_id);
    setDeleteError('');
    closeEdit();
  };

  const cancelDelete = () => { setDeleteId(null); setDeleteError(''); };

  const handleDelete = async (id: number) => {
    setDeleteSubmit(true); setDeleteError('');
    try {
      await roleService.deleteRole(id);
      setRoles(prev => prev.filter(r => r.role_id !== id));
      setDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete role.');
    } finally {
      setDeleteSubmit(false);
    }
  };

  // ── Grouping ─────────────────────────────────────────────────────────────────

  const discordRoles = roles.filter(r => !r.role_discord_id?.startsWith('app-'));
  const appRoles = roles.filter(r => r.role_discord_id?.startsWith('app-'));

  const showDiscord = filter === null || filter === 'discord';
  const showApp = filter === null || filter === 'application';

  // ── Row renderer ─────────────────────────────────────────────────────────────

  const renderRole = (role: Role, idx: number) => (
    <Box
      key={role.role_id}
      px="sm"
      py="xs"
      className={deleteId !== role.role_id ? 'inventory-row' : undefined}
      style={displayRows.row(idx)}
    >
      {deleteId === role.role_id ? (
        <Stack gap={6} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) cancelDelete(); }}>
          <Text size="sm">
            Remove <Text span fw={500} c="najaGold">{role.role_name}</Text>? This cannot be undone.
          </Text>
          {deleteError && <Text size="xs" c="red">{deleteError}</Text>}
          <Group gap="xs">
            <Button size="compact-sm" variant="default" className="delete-btn" onClick={() => handleDelete(role.role_id)} loading={deleteSubmit}>
              Confirm
            </Button>
            <Button size="compact-sm" variant="outline" color="gray" onClick={cancelDelete} disabled={deleteSubmit} autoFocus>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : (
        <Group gap="md" align="center" wrap="nowrap" onClick={() => startEdit(role)} style={{ cursor: 'pointer' }}>
          <Box style={{ flex: 3, minWidth: 0 }}>
            <Text size="md" truncate>{role.role_name}</Text>
            {role.role_description && (
              <Text size="xs" c="dimmed" truncate>{role.role_description}</Text>
            )}
          </Box>
          <Box style={{ flex: 3, minWidth: 0 }}>
            <Text size="sm" c="dimmed" truncate>
              {role.permissions.length > 0 ? role.permissions.join(', ') : '—'}
            </Text>
          </Box>
          <Box style={{ width: 40 }}>
            <ActionIcon
              variant="subtle"
              color="red"
              size="40px"
              onClick={e => { e.stopPropagation(); startDelete(role); }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Box>
        </Group>
      )}
    </Box>
  );

  if (loading) return <Loader size="xs" color="najaGold" />;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Role Management</h1>
        <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
          Create Role
        </Button>
      </Group>

      {error && <Text c="red">{error}</Text>}

      {roles.length > 0 && (
        <Select
          placeholder="Filter by type..."
          value={filter}
          onChange={val => { setDeleteId(null); setFilter(val as 'discord' | 'application' | null); }}
          data={[
            { value: 'discord', label: 'Discord Roles' },
            { value: 'application', label: 'Application Roles' },
          ]}
          clearable
          styles={inputStyles}
          style={{ maxWidth: 260 }}
        />
      )}

      {roles.length === 0 ? (
        <Text c="najaTeal">No roles found. Create one to get started.</Text>
      ) : (
        <Stack gap="xl">
          <Group gap="md" px="sm" pb="xs" style={displayRows.header}>
            <Box style={{ flex: 3 }}>
              <span className="naja-col-label">Name</span>
            </Box>
            <Box style={{ flex: 3 }}>
              <span className="naja-col-label">Grants</span>
            </Box>
            <Box style={{ width: 40 }} />
          </Group>

          {showDiscord && discordRoles.length > 0 && (
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="lg" fw={700} tt="uppercase" c="najaGold" style={{ letterSpacing: '0.05em' }}>
                  Discord Roles
                </Text>
                <Divider flex={1} color="rgba(204,172,49,0.15)" />
              </Group>
              <Stack gap={0}>
                {discordRoles.map((role, idx) => renderRole(role, idx))}
              </Stack>
            </Stack>
          )}

          {showApp && appRoles.length > 0 && (
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="lg" fw={700} tt="uppercase" c="najaGold" style={{ letterSpacing: '0.05em' }}>
                  Application Roles
                </Text>
                <Divider flex={1} color="rgba(204,172,49,0.15)" />
              </Group>
              <Stack gap={0}>
                {appRoles.map((role, idx) => renderRole(role, idx))}
              </Stack>
            </Stack>
          )}
        </Stack>
      )}

      {/* ── Add Drawer ───────────────────────────────────────────────────────── */}
      <Drawer
        opened={addOpen}
        onClose={closeAdd}
        title={<Text fw={700} c="najaGold" tt="uppercase" size="md">Create Role</Text>}
        position="right"
        size="lg"
        classNames={drawerClassNames}
      >
        <form onSubmit={handleAdd}>
          <Stack gap="sm" pt="xs">
            <TextInput
              label="Discord Role ID"
              description="Required for Discord roles. Leave blank for app-only roles."
              value={addData.role_discord_id || ''}
              onChange={e => setAddData({ ...addData, role_discord_id: e.currentTarget.value })}
              styles={inputStyles}
              autoFocus
            />
            <TextInput
              label="Role Name"
              value={addData.role_name || ''}
              onChange={e => { setAddData({ ...addData, role_name: e.currentTarget.value }); setAddError(''); }}
              styles={inputStyles}
              required
            />
            <TextInput
              label="Description"
              value={addData.role_description || ''}
              onChange={e => setAddData({ ...addData, role_description: e.currentTarget.value })}
              styles={inputStyles}
            />
            <MultiSelect
              label="Permissions"
              value={addData.permissions || []}
              onChange={val => setAddData({ ...addData, permissions: val })}
              data={permissionOptions}
              styles={inputStyles}
            />
            {addError && <Text size="sm" c="red">{addError}</Text>}
            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" color="gray" onClick={closeAdd} disabled={addSubmitting}>Cancel</Button>
              <Button type="submit" loading={addSubmitting}>Create</Button>
            </Group>
          </Stack>
        </form>
      </Drawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────────────── */}
      <Drawer
        opened={editOpen}
        onClose={closeEdit}
        title={
          <Text fw={700} c="najaGold" tt="uppercase" size="md">
            {editingRole?.role_name || 'Edit Role'}
          </Text>
        }
        position="right"
        size="lg"
        classNames={drawerClassNames}
      >
        <form onSubmit={handleEdit}>
          <Stack gap="sm" pt="xs">
            {editingRole?.role_discord_id && !editingRole.role_discord_id.startsWith('app-') && (
              <TextInput
                label="Discord Role ID"
                value={editingRole.role_discord_id}
                disabled
                styles={inputStyles}
              />
            )}
            <TextInput
              label="Role Name"
              value={editData.role_name || ''}
              onChange={e => { setEditData({ ...editData, role_name: e.currentTarget.value }); setEditError(''); }}
              styles={inputStyles}
              autoFocus
              required
            />
            <TextInput
              label="Description"
              value={editData.role_description || ''}
              onChange={e => setEditData({ ...editData, role_description: e.currentTarget.value })}
              styles={inputStyles}
            />
            <MultiSelect
              label="Permissions"
              value={editData.permissions || []}
              onChange={val => setEditData({ ...editData, permissions: val })}
              data={permissionOptions}
              styles={inputStyles}
            />
            {editError && <Text size="sm" c="red">{editError}</Text>}
            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" color="gray" onClick={closeEdit} disabled={editSubmit}>Cancel</Button>
              <Button type="submit" loading={editSubmit}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Drawer>
    </Stack>
  );
};

export default RoleManagement;
