import type { Permission, PermissionCreate, PermissionUpdate } from '../../types/permission';

class PermissionService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/admin/permissions`;

  async getAllPermissions(): Promise<Permission[]> {
    const response = await fetch(this.baseUrl, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async createPermission(data: PermissionCreate): Promise<Permission> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async updatePermission(id: number, data: PermissionUpdate): Promise<Permission> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async deletePermission(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `HTTP error! status: ${response.status}`);
    }
  }
}

export const permissionService = new PermissionService();
