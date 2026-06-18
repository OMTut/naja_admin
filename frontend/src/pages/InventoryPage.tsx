import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, SimpleGrid, Divider, Group } from '@mantine/core';
import { IconBox } from '@tabler/icons-react';
import { miscInventoryService } from '../services/inventory/miscInventoryService';
import type { InventoryCatalogItem } from '../types/inventory';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';

const InventoryPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<InventoryCatalogItem[]>([]);

  useEffect(() => {
    miscInventoryService.getCatalog().then(setCatalog).catch(() => {});
  }, []);

  // Group items by category
  const grouped = catalog.reduce<Record<string, InventoryCatalogItem[]>>((acc, item) => {
    const key = item.category?.name ?? 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  if (catalog.length === 0) {
    return (
      <Stack gap="lg">
        <Text c="najaTeal">No inventory items tracked yet.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      {categories.map(category => (
        <Stack key={category} gap="xs">
          <Group gap="xs" align="center">
            <Text size="sm" tt="uppercase" fw={700} c="najaGold" style={{ letterSpacing: '0.05em' }}>
              {category}
            </Text>
            <Divider flex={1} color="rgba(204,172,49,0.15)" />
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
            {grouped[category].map(item => (
              <InventorySummaryCard
                key={item.id}
                title={item.display_name}
                value={item.total_quantity}
                icon={IconBox}
                onClick={() => navigate(`/inventory/misc/${item.id}`)}
              />
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
};

export default InventoryPage;
