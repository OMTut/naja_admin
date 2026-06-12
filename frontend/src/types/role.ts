export interface Role {
  role_id: number;
  role_discord_id: string;
  role_name: string;
  role_description: string | null;
  grants_access: boolean;
  grants_inventory: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  role_discord_id?: string;
  role_name: string;
  role_description?: string;
  grants_access?: boolean;
  grants_inventory?: boolean;
}

export interface RoleUpdate {
  role_name?: string;
  role_description?: string;
  grants_access?: boolean;
  grants_inventory?: boolean;
}
