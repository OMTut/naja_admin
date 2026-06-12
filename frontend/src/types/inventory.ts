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

// ── Misc Inventory ────────────────────────────────────────────────────────────

export interface MiscCategory {
  id:         number;
  name:       string;
  item_count: number;
  created_at: string;
}

export interface InventoryCatalogItem {
  id:             number;
  display_name:   string;
  category:       MiscCategory | null;
  total_quantity: number;
  holder_count:   number;
  created_at:     string;
}

export interface MiscInventoryEntry {
  id:              number;
  catalog_item_id: number;
  display_name:    string;
  category:        MiscCategory | null;
  location:        string | null;
  quantity:        number;
  status:          'active' | 'depleted';
  held_by:         InventoryUser | null;
  added_by:        InventoryUser | null;
  created_at:      string;
  updated_at:      string;
}

export interface MiscInventoryEvent {
  id:           number;
  item_id:      number;
  event_type:   'added' | 'transferred' | 'consumed';
  quantity:     number;
  from_user:    InventoryUser | null;
  to_user:      InventoryUser | null;
  performed_by: InventoryUser | null;
  created_at:   string;
}

export interface CatalogItemCreate {
  display_name: string;
  category_id?: number;
}

export interface CatalogItemUpdate {
  display_name?: string;
  category_id?:  number;
}

export interface HoldingCreate {
  catalog_item_id: number;
  location?:       string;
  quantity:        number;
  held_by?:        number;
  added_by?:       number;
}

export interface MiscTransferBody {
  to_user_id: number;
  quantity:   number;
}

export interface MiscConsumeBody {
  quantity: number;
}
