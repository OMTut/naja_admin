export interface User {
  id: number;
  discord_id: string;
  discord_username: string;
  server_nickname: string | null;
  email: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
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
