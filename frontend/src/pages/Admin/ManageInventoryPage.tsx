import { Stack, Text } from '@mantine/core';
import MiscInventoryManagement from '../../components/admin/MiscInventoryManagement';


const ManageInventoryPage = () => (
  <Stack gap="lg">
    <h1 style={{ margin: 0 }}>Manage Inventory</h1>
    <Stack gap="xs">
      <Text>Manage the Items and Categories tracked for the Souli</Text>
      <MiscInventoryManagement />
    </Stack>
  </Stack>
);

export default ManageInventoryPage;
