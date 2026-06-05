import type { BlueprintSummary, BlueprintDetail, OrgBlueprint, ItemCategory, SyncResult } from '../../types/blueprint';

class BlueprintService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/admin/blueprints`;

  async getCategories(): Promise<ItemCategory[]> {
    const res = await fetch(`${this.baseUrl}/categories`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  }

  async getBlueprints(categoryUuid?: string): Promise<BlueprintSummary[]> {
    const url = categoryUuid
      ? `${this.baseUrl}/?category=${categoryUuid}`
      : `${this.baseUrl}/`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load blueprints');
    return res.json();
  }

  async getBlueprint(uuid: string): Promise<BlueprintDetail> {
    const res = await fetch(`${this.baseUrl}/${uuid}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Blueprint not found');
    return res.json();
  }

  async getOrgBlueprints(): Promise<OrgBlueprint[]> {
    const res = await fetch(`${this.baseUrl}/org`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load org blueprints');
    return res.json();
  }

  async sync(): Promise<SyncResult> {
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

export const blueprintService = new BlueprintService();
