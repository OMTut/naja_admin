export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface PermissionCreate {
  name: string;
  description?: string;
}

export interface PermissionUpdate {
  description?: string;
}
