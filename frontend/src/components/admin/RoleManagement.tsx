import { useState, useEffect } from 'react';
import {
  Table, Modal, TextInput, Checkbox, Button, Menu,
  Group, Text, Stack,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import type { Role, RoleCreate, RoleUpdate } from '../../types/role';
import { roleService } from '../../services/admin/roleService';
import { inputStyles, modalStyles, tableStyles, menuStyles } from '../../styles/mantine';

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [, setIsCreating] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const [formData, setFormData] = useState<RoleCreate>({
    role_discord_id: '',
    role_name: '',
    role_description: '',
    grants_access: false,
  });

  useEffect(() => { loadRoles(); }, []);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roleService.createRole(formData);
      cancelForm();
      loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      const updateData: RoleUpdate = {
        role_name: formData.role_name,
        role_description: formData.role_description,
        grants_access: formData.grants_access,
      };
      await roleService.updateRole(editingRole.role_id, updateData);
      cancelForm();
      loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await roleService.deleteRole(roleId);
      loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setIsCreating(false);
    setFormData({
      role_discord_id: role.role_discord_id,
      role_name: role.role_name,
      role_description: role.role_description || '',
      grants_access: role.grants_access,
    });
    open();
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingRole(null);
    resetForm();
    open();
  };

  const cancelForm = () => {
    close();
    setIsCreating(false);
    setEditingRole(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ role_discord_id: '', role_name: '', role_description: '', grants_access: false });
  };

  if (loading) return <Text c="#CCAC31">Loading roles...</Text>;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Role Management</h1>
        <Button color="najaGold" onClick={startCreate}>+ Create Role</Button>
      </Group>

      {error && <Text c="red">{error}</Text>}

      <Modal
        opened={opened}
        onClose={cancelForm}
        title={<Text c="#CCAC31" fw={700}>{editingRole ? 'Edit Role' : 'Create New Role'}</Text>}
        styles={modalStyles}
      >
        <form onSubmit={editingRole ? handleUpdate : handleCreate}>
          <Stack gap="sm">
            <TextInput
              label="Discord Role ID"
              value={formData.role_discord_id}
              onChange={(e) => setFormData({ ...formData, role_discord_id: e.target.value })}
              required
              disabled={!!editingRole}
              styles={inputStyles}
            />
            <TextInput
              label="Role Name"
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              required
              styles={inputStyles}
            />
            <TextInput
              label="Description"
              value={formData.role_description}
              onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
              styles={inputStyles}
            />
            <Checkbox
              label="Grants Access"
              checked={formData.grants_access}
              onChange={(e) => setFormData({ ...formData, grants_access: e.currentTarget.checked })}
              color="najaGold"
              styles={{ label: { color: '#DDD3BA', fontFamily: "'Vollkorn', Georgia, serif" } }}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="outline" color="gray" onClick={cancelForm}>Cancel</Button>
              <Button type="submit" color="najaGold">{editingRole ? 'Update' : 'Create'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Table striped highlightOnHover styles={tableStyles}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Discord ID</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Grants Access</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {roles.map((role) => (
            <Table.Tr key={role.role_id}>
              <Table.Td>{role.role_id}</Table.Td>
              <Table.Td>{role.role_discord_id}</Table.Td>
              <Table.Td>{role.role_name}</Table.Td>
              <Table.Td>{role.role_description || '—'}</Table.Td>
              <Table.Td>
                <Text size="sm" c={role.grants_access ? 'var(--naja-gold)' : 'dimmed'}>
                  {role.grants_access ? 'Yes' : 'No'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Menu position="bottom-end" withArrow arrowSize={8} styles={menuStyles}>
                  <Menu.Target>
                    <Button variant="subtle" color="gray" size="xs" px={16}>...</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconEdit size={14} stroke={1.5} />} onClick={() => startEdit(role)}>
                      Edit
                    </Menu.Item>
                    <Menu.Divider style={{ borderColor: 'rgba(204, 172, 49, 0.2)' }} />
                    <Menu.Item
                      leftSection={<IconTrash size={14} stroke={1.5} />}
                      onClick={() => handleDelete(role.role_id)}
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

      {roles.length === 0 && <Text c="#DDD3BA">No roles found. Create one to get started.</Text>}
    </Stack>
  );
};

export default RoleManagement;
