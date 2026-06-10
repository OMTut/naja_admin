import type { Ore, OreSyncResult } from '../../types/ore';

class OreService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/admin/ores`;

  async getOres(): Promise<Ore[]> {
    const res = await fetch(`${this.baseUrl}/`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load ores');
    return res.json();
  }

  async sync(): Promise<OreSyncResult> {
    const res = await fetch(`${this.baseUrl}/sync`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Sync failed');
    }
    return res.json();
  }
}

export const oreService = new OreService();
