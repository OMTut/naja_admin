import { Stack, Text } from '@mantine/core';
import MiscInventoryManagement from '../../components/admin/MiscInventoryManagement';

const sectionLabel = {
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '13px',
};

const ManageInventoryPage = () => (
  <Stack gap="lg">
    <h1 style={{ margin: 0 }}>Manage Inventory</h1>
    <Stack gap="xs">
      <Text size="md" fw={700} c="#CCAC31" style={sectionLabel}>Miscellaneous Items</Text>
      <MiscInventoryManagement />
    </Stack>
  </Stack>
);

export default ManageInventoryPage;
