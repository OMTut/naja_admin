export interface Role {
  role_id: number;
  role_discord_id: string;
  role_name: string;
  role_description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  role_discord_id?: string;
  role_name: string;
  role_description?: string;
  permissions?: string[];
}

export interface RoleUpdate {
  role_name?: string;
  role_description?: string;
  permissions?: string[];
}
