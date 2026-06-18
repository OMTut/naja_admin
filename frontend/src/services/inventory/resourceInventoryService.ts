import type {
  ResourceInventoryEntry,
  ResourceInventoryCreate,
  ResourceInventoryUpdate,
} from '../../types/inventory';

class ResourceInventoryService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/inventory/resources`;

  async getAll(): Promise<ResourceInventoryEntry[]> {
    const res = await fetch(this.baseUrl, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load inventory');
    return res.json();
  }

  async add(data: ResourceInventoryCreate): Promise<ResourceInventoryEntry> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to add inventory entry');
    }
    return res.json();
  }

  async update(id: number, data: ResourceInventoryUpdate): Promise<ResourceInventoryEntry> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update entry');
    }
    return res.json();
  }

  async remove(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete entry');
    }
  }
}

export const resourceInventoryService = new ResourceInventoryService();
