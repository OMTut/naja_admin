import { useState, useEffect } from 'react';
import {
  Drawer, Stack, Group, Text, Button, Box,
  TextInput, ActionIcon, Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { drawerClassNames, inputStyles, displayRows } from '../../styles/mantine';
import type { Permission, PermissionCreate, PermissionUpdate } from '../../types/permission';
import { permissionService } from '../../services/admin/permissionService';

const PermissionManagement = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add drawer
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [addData, setAddData] = useState<PermissionCreate>({ name: '', description: '' });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit drawer
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  const [editData, setEditData] = useState<PermissionUpdate>({});
  const [editSubmit, setEditSubmit] = useState(false);
  const [editError, setEditError] = useState('');

  // Inline delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSubmit, setDeleteSubmit] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setPermissions(await permissionService.getAllPermissions());
      setError(null);
    } catch {
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  // ── Add ──────────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addData.name?.trim()) { setAddError('Name is required.'); return; }
    setAddSubmitting(true); setAddError('');
    try {
      await permissionService.createPermission({
        name: addData.name.trim(),
        description: addData.description?.trim() || undefined,
      });
      closeAdd();
      setAddData({ name: '', description: '' });
      loadPermissions();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create permission.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (perm: Permission) => {
    setEditingPerm(perm);
    setEditData({ description: perm.description || '' });
    setEditError('');
    setDeleteId(null);
    openEdit();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerm) return;
    setEditSubmit(true); setEditError('');
    try {
      await permissionService.updatePermission(editingPerm.id, {
        description: editData.description?.trim() || undefined,
      });
      closeEdit();
      loadPermissions();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update permission.');
    } finally {
      setEditSubmit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const startDelete = (perm: Permission) => {
    setDeleteId(perm.id);
    setDeleteError('');
    closeEdit();
  };

  const cancelDelete = () => { setDeleteId(null); setDeleteError(''); };

  const handleDelete = async (id: number) => {
    setDeleteSubmit(true); setDeleteError('');
    try {
      await permissionService.deletePermission(id);
      setPermissions(prev => prev.filter(p => p.id !== id));
      setDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete permission.');
    } finally {
      setDeleteSubmit(false);
    }
  };

  // ── Row renderer ─────────────────────────────────────────────────────────────

  const renderPermission = (perm: Permission, idx: number) => (
    <Box
      key={perm.id}
      px="sm"
      py="xs"
      className={deleteId !== perm.id ? 'inventory-row' : undefined}
      style={displayRows.row(idx)}
    >
      {deleteId === perm.id ? (
        <Stack gap={6} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) cancelDelete(); }}>
          <Text size="sm">
            Remove <Text span fw={500} c="najaGold">{perm.name}</Text>? This will remove it from all roles.
          </Text>
          {deleteError && <Text size="xs" c="red">{deleteError}</Text>}
          <Group gap="xs">
            <Button size="compact-sm" variant="default" className="delete-btn" onClick={() => handleDelete(perm.id)} loading={deleteSubmit}>
              Confirm
            </Button>
            <Button size="compact-sm" variant="outline" color="gray" onClick={cancelDelete} disabled={deleteSubmit} autoFocus>
              Cancel
            </Button>
          </Group>
        </Stack>
      ) : (
        <Group gap="md" align="center" wrap="nowrap" onClick={() => startEdit(perm)} style={{ cursor: 'pointer' }}>
          <Box style={{ flex: 2, minWidth: 0 }}>
            <Text size="md" truncate>{perm.name}</Text>
          </Box>
          <Box style={{ flex: 4, minWidth: 0 }}>
            <Text size="sm" c="dimmed" truncate>{perm.description || '—'}</Text>
          </Box>
          <Box style={{ width: 40 }}>
            <ActionIcon
              variant="subtle"
              color="red"
              size="40px"
              onClick={e => { e.stopPropagation(); startDelete(perm); }}
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
        <h1 style={{ margin: 0 }}>Permission Management</h1>
        <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
          Create Permission
        </Button>
      </Group>

      {error && <Text c="red">{error}</Text>}

      {permissions.length === 0 ? (
        <Text c="najaTeal">No permissions found. Create one to get started.</Text>
      ) : (
        <Stack gap={0}>
          <Group gap="md" px="sm" pb="xs" style={displayRows.header}>
            <Box style={{ flex: 2 }}>
              <span className="naja-col-label">Name</span>
            </Box>
            <Box style={{ flex: 4 }}>
              <span className="naja-col-label">Description</span>
            </Box>
            <Box style={{ width: 40 }} />
          </Group>
          <Stack gap={0}>
            {permissions.map((perm, idx) => renderPermission(perm, idx))}
          </Stack>
        </Stack>
      )}

      {/* ── Add Drawer ───────────────────────────────────────────────────────── */}
      <Drawer
        opened={addOpen}
        onClose={closeAdd}
        title={<Text fw={700} c="najaGold" tt="uppercase" size="md">Create Permission</Text>}
        position="right"
        size="lg"
        classNames={drawerClassNames}
      >
        <form onSubmit={handleAdd}>
          <Stack gap="sm" pt="xs">
            <TextInput
              label="Name"
              description="Used in code checks — lowercase with underscores (e.g. site_access)"
              value={addData.name}
              onChange={e => { setAddData({ ...addData, name: e.currentTarget.value }); setAddError(''); }}
              styles={inputStyles}
              autoFocus
              required
            />
            <TextInput
              label="Description"
              value={addData.description || ''}
              onChange={e => setAddData({ ...addData, description: e.currentTarget.value })}
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
            {editingPerm?.name || 'Edit Permission'}
          </Text>
        }
        position="right"
        size="lg"
        classNames={drawerClassNames}
      >
        <form onSubmit={handleEdit}>
          <Stack gap="sm" pt="xs">
            <TextInput
              label="Name"
              value={editingPerm?.name || ''}
              disabled
              styles={inputStyles}
              description="Permission names cannot be changed after creation"
            />
            <TextInput
              label="Description"
              value={editData.description || ''}
              onChange={e => setEditData({ ...editData, description: e.currentTarget.value })}
              styles={inputStyles}
              autoFocus
            />
            {editError && <Text size="sm" c="red">{editError}</Text>}
            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" color="gray" onClick={() => { closeEdit(); startDelete(editingPerm!); }}>
                Delete
              </Button>
              <Button variant="subtle" color="gray" onClick={closeEdit} disabled={editSubmit}>Cancel</Button>
              <Button type="submit" loading={editSubmit}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Drawer>
    </Stack>
  );
};

export default PermissionManagement;
