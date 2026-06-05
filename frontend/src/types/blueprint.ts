export interface ItemCategory {
  uuid: string;
  record_key: string | null;
  label: string;
  sort_order: number | null;
}

export interface BlueprintSummary {
  uuid: string;
  key: string | null;
  category_uuid: string | null;
  category_label: string | null;
  output_name: string | null;
  output_class: string | null;
  craft_time_label: string | null;
  ingredient_count: number | null;
}

export interface BlueprintIngredient {
  name: string;
  kind: string | null;
  resource_type_uuid: string | null;
  item_uuid: string | null;
  quantity_scu: number | null;
  quantity: number | null;
}

export interface BlueprintOwner {
  user_id: number;
  discord_username: string;
  global_name: string | null;
  server_nickname: string | null;
}

export interface BlueprintDetail extends BlueprintSummary {
  craft_time_seconds: number | null;
  owners: BlueprintOwner[];
  ingredients: BlueprintIngredient[] | null;
}

export interface OrgBlueprint extends BlueprintSummary {
  owner_count: number;
  owners: BlueprintOwner[];
}

export interface UserBlueprintEntry extends BlueprintSummary {
  added_at: string;
}

export interface SyncResult {
  success: boolean;
  result: {
    categories:  { added: number; updated: number };
    blueprints:  { added: number; updated: number };
    ingredients: { synced: number };
  };
}
