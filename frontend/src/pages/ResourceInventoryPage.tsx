import { Stack, Text } from '@mantine/core';
import ResourceInventoryTable from '../components/inventory/ResourceInventoryTable';

const sectionLabel = {
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '13px',
};

const ResourceInventoryPage = () => (
  <Stack gap="lg">
    <h1 style={{ margin: 0 }}>Inventory</h1>
    <Stack gap="xs">
      <Text size="md" fw={700} c="#CCAC31" style={sectionLabel}>Resources</Text>
      <ResourceInventoryTable />
    </Stack>
  </Stack>
);

export default ResourceInventoryPage;
