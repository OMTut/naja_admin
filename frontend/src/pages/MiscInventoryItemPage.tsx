import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Text, Group, ActionIcon } from '@mantine/core';
import { IconBox, IconArrowLeft } from '@tabler/icons-react';
import { miscInventoryService } from '../services/inventory/miscInventoryService';
import type { InventoryCatalogItem } from '../types/inventory';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import MiscInventoryTable from '../components/inventory/MiscInventoryTable';

const MiscInventoryItemPage = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miscInventoryService.getCatalog()
      .then(catalog => {
        const found = catalog.find(c => c.id === Number(itemId));
        setItem(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [itemId]);

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

      <InventorySummaryCard
        title={item.display_name}
        value={item.total_quantity}
        icon={IconBox}
        onClick={() => {}}
      />

      <MiscInventoryTable catalogItemId={item.id} />
    </Stack>
  );
};

export default MiscInventoryItemPage;
