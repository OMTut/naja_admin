import type {
  MiscCategory,
  InventoryCatalogItem,
  MiscInventoryEntry,
  MiscInventoryEvent,
  CatalogItemCreate,
  CatalogItemUpdate,
  HoldingCreate,
  MiscTransferBody,
  MiscConsumeBody,
  InventoryUser,
} from '../../types/inventory';

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/inventory/misc`;

async function _json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `Request failed (${res.status})`);
  }
  return res.json();
}

class MiscInventoryService {
  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(): Promise<MiscCategory[]> {
    const res = await fetch(`${BASE}/categories`, { credentials: 'include' });
    return _json(res);
  }

  async createCategory(name: string): Promise<MiscCategory> {
    const res = await fetch(`${BASE}/categories`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return _json(res);
  }

  async updateCategory(id: number, name: string): Promise<MiscCategory> {
    const res = await fetch(`${BASE}/categories/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return _json(res);
  }

  async deleteCategory(id: number): Promise<void> {
    const res = await fetch(`${BASE}/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to delete category');
    }
  }

  // ── Catalog ────────────────────────────────────────────────────────────────

  async getCatalog(): Promise<InventoryCatalogItem[]> {
    const res = await fetch(`${BASE}/catalog`, { credentials: 'include' });
    return _json(res);
  }

  async createCatalogItem(data: CatalogItemCreate): Promise<InventoryCatalogItem> {
    const res = await fetch(`${BASE}/catalog`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return _json(res);
  }

  async updateCatalogItem(id: number, data: CatalogItemUpdate): Promise<InventoryCatalogItem> {
    const res = await fetch(`${BASE}/catalog/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return _json(res);
  }

  async deleteCatalogItem(id: number): Promise<void> {
    const res = await fetch(`${BASE}/catalog/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to delete catalog item');
    }
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async getMembers(): Promise<InventoryUser[]> {
    const res = await fetch(`${BASE}/members`, { credentials: 'include' });
    return _json(res);
  }

  // ── Holdings ───────────────────────────────────────────────────────────────

  async getHoldings(): Promise<MiscInventoryEntry[]> {
    const res = await fetch(BASE, { credentials: 'include' });
    return _json(res);
  }

  async addHolding(data: HoldingCreate): Promise<MiscInventoryEntry> {
    const res = await fetch(BASE, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return _json(res);
  }

  async updateLocation(id: number, location: string): Promise<MiscInventoryEntry> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });
    return _json(res);
  }

  async transfer(id: number, data: MiscTransferBody): Promise<MiscInventoryEntry> {
    const res = await fetch(`${BASE}/${id}/transfer`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return _json(res);
  }

  async consume(id: number, data: MiscConsumeBody): Promise<MiscInventoryEntry> {
    const res = await fetch(`${BASE}/${id}/consume`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return _json(res);
  }

  async getEvents(id: number): Promise<MiscInventoryEvent[]> {
    const res = await fetch(`${BASE}/${id}/events`, { credentials: 'include' });
    return _json(res);
  }

  async removeHolding(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail || 'Failed to delete holding');
    }
  }
}

export const miscInventoryService = new MiscInventoryService();
