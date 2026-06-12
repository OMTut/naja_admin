import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, SimpleGrid } from '@mantine/core';
import { IconId } from '@tabler/icons-react';
import { miscInventoryService } from '../services/inventory/miscInventoryService';
import type { InventoryCatalogItem } from '../types/inventory';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import MiscInventoryTable from '../components/inventory/MiscInventoryTable';

const sectionLabel = {
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '13px',
};

const MiscInventoryPage = () => {
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
      <h1 style={{ margin: 0 }}>Miscellaneous Inventory</h1>
      <SimpleGrid cols={{ base: 2, sm: 4, lg: 4 }}>
        <InventorySummaryCard
          title="Red Keycards"
          value={getQty('PYAM Supervisor Keycard (Level 2)')}
          icon={IconId}
          onClick={() => navigate('/inventory/misc')}
        />
      </SimpleGrid>
      <Stack gap="xs">
        <MiscInventoryTable />
      </Stack>
    </Stack>
  );
};

export default MiscInventoryPage;
