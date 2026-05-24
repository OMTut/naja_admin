export interface UserRole {
  role_name: string;
  grants_access: boolean;
}

export interface User {
  id: number;
  discord_id: string;
  discord_username: string;
  global_name: string | null;
  server_nickname: string | null;
  email: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  roles: UserRole[];
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export interface UserUpdate {
  discord_username?: string;
  server_nickname?: string;
  email?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'banned';
}
