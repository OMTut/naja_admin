export interface Ore {
  id:           number;
  display_name: string;
  type:         string | null;
}

export interface OreSyncResult {
  success: boolean;
  result: {
    ores: { added: number; updated: number };
  };
}
