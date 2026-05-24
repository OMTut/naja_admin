export interface SessionResponse {
  authenticated: boolean;
  message?: string;
  user?: {
    id: number;
    discord_username: string;
    discord_avatar: string;
    status: string;
    roles: string[];
  };
}

class AuthService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

  /**
   * Check if the user has a valid session
   */
  async checkSession(): Promise<SessionResponse> {
    try {
      console.log('Checking session...');
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking session:', error);
      return {
        authenticated: false,
        message: 'Failed to check session',
      };
    }
  }

  /**
   * Logout the user by clearing the session
   */
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();

