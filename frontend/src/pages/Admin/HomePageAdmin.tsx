import { useNavigate } from 'react-router-dom';
import { Stack, Group, Text, Button } from '@mantine/core';

const HomePageAdmin = () => {
  const navigate = useNavigate();

  return (
    <Stack gap="lg">
      <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
      <Text>Welcome to the administration panel.</Text>

      <Stack gap="xs">
        <Text size="md" fw={700} c="#CCAC31" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>
          Quick Actions
        </Text>
        <Group gap="sm">
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/roles')}>
            Manage Roles
          </Button>
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
};

export default HomePageAdmin;
