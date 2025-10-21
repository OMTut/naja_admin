import { useState, useEffect } from 'react';
import type { User, UserUpdate } from '../../types/user';
import { userService } from '../../services/admin/userService';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState<UserUpdate>({
    discord_username: '',
    server_nickname: '',
    email: '',
    status: 'pending',
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await userService.updateUser(editingUser.id, formData);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      discord_username: user.discord_username,
      server_nickname: user.server_nickname || '',
      email: user.email || '',
      status: user.status,
    });
  };

  const cancelForm = () => {
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      discord_username: '',
      server_nickname: '',
      email: '',
      status: 'pending',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'orange';
      case 'rejected':
        return 'red';
      case 'banned':
        return 'darkred';
      default:
        return 'gray';
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Management</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {/* Edit Form */}
      {editingUser && (
        <form onSubmit={handleUpdate} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
          <h3>Edit User</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              Discord ID:
              <input
                type="text"
                value={editingUser.discord_id}
                disabled
                style={{ marginLeft: '10px', width: '200px', backgroundColor: '#eee' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Discord Username:
              <input
                type="text"
                value={formData.discord_username}
                onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                style={{ marginLeft: '10px', width: '200px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Server Nickname:
              <input
                type="text"
                value={formData.server_nickname}
                onChange={(e) => setFormData({ ...formData, server_nickname: e.target.value })}
                style={{ marginLeft: '10px', width: '200px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Email:
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ marginLeft: '10px', width: '250px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Status:
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          <div>
            <button type="submit" style={{ marginRight: '10px' }}>
              Update
            </button>
            <button type="button" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Discord ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Username</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Nickname</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '10px' }}>{user.id}</td>
              <td style={{ padding: '10px' }}>{user.discord_id}</td>
              <td style={{ padding: '10px' }}>{user.discord_username}</td>
              <td style={{ padding: '10px' }}>{user.server_nickname || '-'}</td>
              <td style={{ padding: '10px' }}>{user.email || '-'}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  backgroundColor: getStatusBadgeColor(user.status),
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {user.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => startEdit(user)} style={{ marginRight: '5px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p style={{ marginTop: '20px' }}>No users found.</p>
      )}
    </div>
  );
};

export default UserManagement;
