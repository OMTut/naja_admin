import type { UserBlueprintEntry } from '../../types/blueprint';

class UserBlueprintService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/user/blueprints`;

  async getMyBlueprints(): Promise<UserBlueprintEntry[]> {
    const res = await fetch(this.baseUrl, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load your blueprints');
    return res.json();
  }

  async addBlueprint(blueprintUuid: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${blueprintUuid}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to add blueprint');
    }
  }

  async removeBlueprint(blueprintUuid: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${blueprintUuid}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to remove blueprint');
  }
}

export const userBlueprintService = new UserBlueprintService();
