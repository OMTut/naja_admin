import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Text, Group, ActionIcon, SimpleGrid } from '@mantine/core';
import { IconBox, IconArrowLeft } from '@tabler/icons-react';
import { miscInventoryService } from '../services/inventory/miscInventoryService';
import type { InventoryCatalogItem } from '../types/inventory';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import MiscInventoryTable from '../components/inventory/MiscInventoryTable';
import { fromSlug } from '../utils/slug';

const MiscInventoryItemPage = () => {
  const { itemSlug } = useParams<{ itemSlug: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miscInventoryService.getCatalog()
      .then(catalog => setItem(fromSlug(catalog, itemSlug ?? '') ?? null))
      .finally(() => setLoading(false));
  }, [itemSlug]);

  if (loading) return <Text c="najaGold">Loading...</Text>;
  if (!item) return <Text c="red">Item not found.</Text>;

  return (
    <Stack gap="lg">
      <Group gap="sm" align="center">
        <ActionIcon variant="subtle" color="najaGold" onClick={() => navigate('/inventory')}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <h1 style={{ margin: 0 }}>{item.display_name}</h1>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
        <InventorySummaryCard
          title={item.display_name}
          value={item.total_quantity}
          icon={IconBox}
          onClick={() => {}}
        />
      </SimpleGrid>

      <MiscInventoryTable catalogItemId={item.id} />
    </Stack>
  );
};

export default MiscInventoryItemPage;
