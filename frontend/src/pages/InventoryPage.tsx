import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, SimpleGrid } from '@mantine/core';
import { IconId } from '@tabler/icons-react';
import { miscInventoryService } from '../services/inventory/miscInventoryService';
import type { InventoryCatalogItem } from '../types/inventory';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';

interface CardConfig {
  title:      string;
  itemName:   string;
  icon:       React.FC<{ size?: number; stroke?: number; color?: string }>;
  navigateTo: string;
}

const cards: CardConfig[] = [
  {
    title:      'Red Keycards',
    itemName:   'PYAM Supervisor Keycard (Level 2)',
    icon:       IconId,
    navigateTo: '/inventory/misc',
  },
];

const InventoryPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<InventoryCatalogItem[]>([]);

  useEffect(() => {
    miscInventoryService.getCatalog().then(setCatalog).catch(() => {});
  }, []);

  const getQty = (itemName: string) => {
    const match = catalog.find(
      c => c.display_name.toLowerCase() === itemName.toLowerCase()
    );
    return match ? match.total_quantity : '—';
  };

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Text size="s" tt="uppercase" fw={700} c="var(--naja-text)" style={{ letterSpacing: '0.05em' }}>
          Miscellaneous Items
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 4, lg: 4 }}>
          {cards.map(card => (
            <InventorySummaryCard
              key={card.title}
              title={card.title}
              value={getQty(card.itemName)}
              icon={card.icon}
              onClick={() => navigate(card.navigateTo)}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
};

export default InventoryPage;
