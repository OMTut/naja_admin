import type { User, UserUpdate } from '../../types/user';

class UserService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/admin/users`;

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: number): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: number, userData: UserUpdate): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Replace a user's roles
   */
  async setUserRoles(userId: number, roleIds: number[]): Promise<{ roles: import('../../types/user').UserRole[]; warning?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/roles`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleIds),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting user roles:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const userService = new UserService();
