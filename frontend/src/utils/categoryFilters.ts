import type { ItemCategory } from '../types/blueprint';

export const VEHICLE_WEAPONS_KEY    = '__vehicle_weapons';
export const VEHICLE_COMPONENTS_KEY = '__vehicle_components';
export const FPS_WEAPONS_KEY        = '__fps_weapons';
export const FPS_ARMOR_KEY          = '__fps_armor';

// Maps home-page stat keys to their category group filter key
export const STAT_KEY_TO_CATEGORY: Record<string, string> = {
  ship_components: VEHICLE_COMPONENTS_KEY,
  ship_weapons:    VEHICLE_WEAPONS_KEY,
  fps_weapons:     FPS_WEAPONS_KEY,
  fps_armor:       FPS_ARMOR_KEY,
};

interface GroupDef {
  key: string;
  label: string;
  prefix: string;
}

const GROUPS: GroupDef[] = [
  { key: VEHICLE_WEAPONS_KEY,    label: 'Vehicle Weapons',   prefix: 'Vehicle Weapon' },
  { key: VEHICLE_COMPONENTS_KEY, label: 'Vehicle Components', prefix: 'Vehicle Component' },
  { key: FPS_WEAPONS_KEY,        label: 'FPS Weapons',        prefix: 'FPS Weapon' },
  { key: FPS_ARMOR_KEY,          label: 'FPS Armor',          prefix: 'FPS Arm' },
];

function groupFor(label: string): GroupDef | undefined {
  return GROUPS.find(g => label.startsWith(g.prefix));
}

export function buildCategoryOptions(categories: ItemCategory[]) {
  const opts: { value: string; label: string }[] = [{ value: '', label: 'All Categories' }];
  const seen = new Set<string>();
  for (const c of categories) {
    const group = groupFor(c.label);
    if (group) {
      if (!seen.has(group.key)) {
        opts.push({ value: group.key, label: group.label });
        seen.add(group.key);
      }
    } else {
      opts.push({ value: c.uuid, label: c.label });
    }
  }
  return opts;
}

export function getSizeOptions(categories: ItemCategory[], groupKey: string | null): string[] {
  const group = GROUPS.find(g => g.key === groupKey);
  if (!group) return [];
  const sizes = new Set<string>();
  for (const c of categories) {
    if (c.label.startsWith(group.prefix)) {
      const match = c.label.match(/S (\d+)$/);
      if (match) sizes.add(match[1]);
    }
  }
  return Array.from(sizes).sort((a, b) => Number(a) - Number(b));
}

export function matchesCategory(
  b: { category_uuid: string | null; category_label: string | null },
  categoryFilter: string | null,
  sizeFilter: string | null = null,
): boolean {
  if (!categoryFilter) return true;
  const group = GROUPS.find(g => g.key === categoryFilter);
  if (group) {
    if (!(b.category_label?.startsWith(group.prefix) ?? false)) return false;
    return sizeFilter ? (b.category_label?.endsWith(` S ${sizeFilter}`) ?? false) : true;
  }
  return b.category_uuid === categoryFilter;
}
