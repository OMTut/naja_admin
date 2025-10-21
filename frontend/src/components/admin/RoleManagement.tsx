import { useState, useEffect } from 'react';
import type { Role, RoleCreate, RoleUpdate } from '../../types/role';
import { roleService } from '../../services/admin/roleService';

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState<RoleCreate>({
    role_discord_id: '',
    role_name: '',
    role_description: '',
    grants_access: false,
  });

  // Load roles on mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAllRoles();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError('Failed to load roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roleService.createRole(formData);
      setIsCreating(false);
      resetForm();
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
      setEditingRole(null);
      resetForm();
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
    setFormData({
      role_discord_id: role.role_discord_id,
      role_name: role.role_name,
      role_description: role.role_description || '',
      grants_access: role.grants_access,
    });
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingRole(null);
    resetForm();
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingRole(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      role_discord_id: '',
      role_name: '',
      role_description: '',
      grants_access: false,
    });
  };

  if (loading) return <div>Loading roles...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Role Management</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {!isCreating && !editingRole && (
        <button onClick={startCreate} style={{ marginBottom: '20px' }}>
          Create New Role
        </button>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingRole) && (
        <form onSubmit={editingRole ? handleUpdate : handleCreate} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
          <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              Discord Role ID:
              <input
                type="text"
                value={formData.role_discord_id}
                onChange={(e) => setFormData({ ...formData, role_discord_id: e.target.value })}
                required
                disabled={!!editingRole}
                style={{ marginLeft: '10px', width: '200px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Role Name:
              <input
                type="text"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                required
                style={{ marginLeft: '10px', width: '200px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Description:
              <input
                type="text"
                value={formData.role_description}
                onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                style={{ marginLeft: '10px', width: '300px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.grants_access}
                onChange={(e) => setFormData({ ...formData, grants_access: e.target.checked })}
              />
              Grants Access
            </label>
          </div>

          <div>
            <button type="submit" style={{ marginRight: '10px' }}>
              {editingRole ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Roles Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Discord ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Grants Access</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.role_id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '10px' }}>{role.role_id}</td>
              <td style={{ padding: '10px' }}>{role.role_discord_id}</td>
              <td style={{ padding: '10px' }}>{role.role_name}</td>
              <td style={{ padding: '10px' }}>{role.role_description || '-'}</td>
              <td style={{ padding: '10px' }}>{role.grants_access ? '✓' : '✗'}</td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => startEdit(role)} style={{ marginRight: '5px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(role.role_id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {roles.length === 0 && (
        <p style={{ marginTop: '20px' }}>No roles found. Create one to get started.</p>
      )}
    </div>
  );
};

export default RoleManagement;
