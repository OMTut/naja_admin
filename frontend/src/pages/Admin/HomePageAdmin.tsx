import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Group, Text, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { blueprintService } from '../../services/admin/blueprintService';

const sectionLabel = {
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '13px',
};

const HomePageAdmin = () => {
  const navigate = useNavigate();
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState('');
  const [syncError, setSyncError] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    setSyncError('');
    try {
      const res = await blueprintService.sync();
      const { categories: c, blueprints: b, ingredients: i } = res.result;
      setSyncMsg(
        `Sync complete — categories: +${c.added} / ~${c.updated}, blueprints: +${b.added} / ~${b.updated}, ingredients: ${i.synced}`
      );
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Stack gap="lg">
      <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
      <Text>Welcome to the administration panel.</Text>

      <Stack gap="xs">
        <Text size="md" fw={700} c="#CCAC31" style={sectionLabel}>Quick Actions</Text>
        <Group gap="sm">
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/roles')}>
            Manage Roles
          </Button>
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
        </Group>
      </Stack>

      <Stack gap="xs">
        <Text size="md" fw={700} c="#CCAC31" style={sectionLabel}>Services</Text>
        <Group gap="sm" align="center">
          <Button
            variant="outline"
            color="najaGold"
            leftSection={<IconRefresh size={16} />}
            loading={syncing}
            onClick={handleSync}
          >
            Sync Blueprints
          </Button>
          {syncMsg   && <Text size="sm" c="var(--naja-teal)">{syncMsg}</Text>}
          {syncError && <Text size="sm" c="red">{syncError}</Text>}
        </Group>
      </Stack>
    </Stack>
  );
};

export default HomePageAdmin;
