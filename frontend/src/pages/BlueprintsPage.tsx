import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Stack, Group, TextInput, Select, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { inputStyles } from '../styles/mantine';
import { blueprintService } from '../services/admin/blueprintService';
import type { ItemCategory } from '../types/blueprint';
import {
  VEHICLE_WEAPONS_KEY, VEHICLE_COMPONENTS_KEY,
  FPS_WEAPONS_KEY, FPS_ARMOR_KEY,
  buildCategoryOptions, getSizeOptions,
} from '../utils/categoryFilters';
import PersonalBlueprints from '../components/blueprints/PersonalBlueprints';
import BlueprintManagement from '../components/admin/BlueprintManagement';

type View = 'personal' | 'org';

const GROUP_KEYS = new Set([VEHICLE_WEAPONS_KEY, VEHICLE_COMPONENTS_KEY, FPS_WEAPONS_KEY, FPS_ARMOR_KEY]);

const BlueprintsPage = () => {
  const [searchParams] = useSearchParams();

  const initialView = searchParams.get('view') === 'org' ? 'org' : 'personal';
  const initialCat  = searchParams.get('cat') ?? null;

  const [view, setView]                     = useState<View>(initialView);
  const [search, setSearch]                 = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(
    initialCat && GROUP_KEYS.has(initialCat) ? initialCat : null
  );
  const [sizeFilter, setSizeFilter]         = useState<string | null>(null);
  const [categories, setCategories]         = useState<ItemCategory[]>([]);
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);

  useEffect(() => {
    blueprintService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const categoryOptions = buildCategoryOptions(categories);
  const sizeOptions     = getSizeOptions(categories, categoryFilter);
  const isGrouped       = categoryFilter !== null && GROUP_KEYS.has(categoryFilter);

  const handleCategoryChange = (val: string | null) => {
    setCategoryFilter(val || null);
    setSizeFilter(null);
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Blueprints</h1>
        <Button variant="filled" onClick={openAdd}>+ Add Blueprint</Button>
      </Group>

      <Group gap="xs">
        <Button
          variant={view === 'personal' ? 'filled' : 'outline'}
          onClick={() => setView('personal')}
        >
          Personal
        </Button>
        <Button
          variant={view === 'org' ? 'filled' : 'outline'}
          onClick={() => setView('org')}
        >
          Org
        </Button>
      </Group>

      <Stack gap="xs">
        <Group gap="sm">
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            styles={inputStyles}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="All Categories"
            data={categoryOptions}
            value={categoryFilter}
            onChange={handleCategoryChange}
            styles={inputStyles}
            style={{ width: 220 }}
            clearable
          />
        </Group>

        {isGrouped && sizeOptions.length > 0 && (
          <Group gap="xs">
            <Button
              size="xs"
              variant={sizeFilter === null ? 'filled' : 'outline'}
              onClick={() => setSizeFilter(null)}
            >
              All Sizes
            </Button>
            {sizeOptions.map(size => (
              <Button
                key={size}
                size="xs"
                variant={sizeFilter === size ? 'filled' : 'outline'}
                onClick={() => setSizeFilter(size)}
              >
                Size {size}
              </Button>
            ))}
          </Group>
        )}
      </Stack>

      <div style={{ display: view === 'personal' ? 'block' : 'none' }}>
        <PersonalBlueprints
          search={search}
          categoryFilter={categoryFilter}
          sizeFilter={sizeFilter}
          categories={categories}
          addModalOpen={addOpen}
          onCloseAdd={closeAdd}
        />
      </div>

      {view === 'org' && (
        <BlueprintManagement
          search={search}
          categoryFilter={categoryFilter}
          sizeFilter={sizeFilter}
          categories={categories}
        />
      )}
    </Stack>
  );
};

export default BlueprintsPage;
