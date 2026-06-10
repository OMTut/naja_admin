export interface InventoryUser {
  id:               number;
  discord_username: string;
  global_name:      string | null;
  server_nickname:  string | null;
}

export interface ResourceInventoryEntry {
  id:           number;
  ore_name:     string;
  quality:      number | null;
  original_scu: number;
  current_scu:  number;
  location:     string | null;
  held_by:      InventoryUser | null;
  added_by:     InventoryUser | null;
  created_at:   string;
  updated_at:   string;
}

export interface ResourceInventoryCreate {
  ore_name:     string;
  quality?:     number;
  original_scu: number;
  location?:    string;
  held_by?:     number;
}

export interface ResourceInventoryUpdate {
  ore_name?:    string;
  quality?:     number;
  current_scu?: number;
  location?:    string;
  held_by?:     number;
}
