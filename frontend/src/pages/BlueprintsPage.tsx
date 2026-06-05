import { useState, useEffect } from 'react';
import { Stack, Group, TextInput, Select, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { inputStyles } from '../styles/mantine';
import { blueprintService } from '../services/admin/blueprintService';
import type { ItemCategory } from '../types/blueprint';
import PersonalBlueprints from '../components/blueprints/PersonalBlueprints';
import BlueprintManagement from '../components/admin/BlueprintManagement';

type View = 'personal' | 'org';

const BlueprintsPage = () => {
  const [view, setView]                     = useState<View>('personal');
  const [search, setSearch]                 = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categories, setCategories]         = useState<ItemCategory[]>([]);
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);

  useEffect(() => {
    blueprintService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.uuid, label: c.label })),
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Blueprints</h1>
        <Button color="najaGold" onClick={openAdd}>+ Add Blueprint</Button>
      </Group>

      <Group gap="xs">
        <Button
          variant={view === 'personal' ? 'filled' : 'outline'}
          color="najaGold"
          onClick={() => setView('personal')}
        >
          Personal
        </Button>
        <Button
          variant={view === 'org' ? 'filled' : 'outline'}
          color="najaGold"
          onClick={() => setView('org')}
        >
          Org
        </Button>
      </Group>

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
          onChange={setCategoryFilter}
          styles={inputStyles}
          style={{ width: 220 }}
          clearable
        />
      </Group>

      <div style={{ display: view === 'personal' ? 'block' : 'none' }}>
        <PersonalBlueprints
          search={search}
          categoryFilter={categoryFilter}
          categories={categories}
          addModalOpen={addOpen}
          onCloseAdd={closeAdd}
        />
      </div>

      {view === 'org' && (
        <BlueprintManagement
          search={search}
          categoryFilter={categoryFilter}
          categories={categories}
        />
      )}
    </Stack>
  );
};

export default BlueprintsPage;
