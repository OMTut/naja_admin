import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Group, Text, Button, Divider } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { blueprintService } from '../../services/admin/blueprintService';
import { oreService } from '../../services/admin/oreService';

const sectionLabel = {
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '13px',
};

const HomePageAdmin = () => {
  const navigate = useNavigate();
  const [syncing, setSyncing]           = useState(false);
  const [syncMsg, setSyncMsg]           = useState('');
  const [syncError, setSyncError]       = useState('');
  const [syncingOres, setSyncingOres]   = useState(false);
  const [syncOresMsg, setSyncOresMsg]   = useState('');
  const [syncOresError, setSyncOresError] = useState('');

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

  const handleSyncOres = async () => {
    setSyncingOres(true);
    setSyncOresMsg('');
    setSyncOresError('');
    try {
      const res = await oreService.sync();
      const { ores: o } = res.result;
      setSyncOresMsg(`Sync complete — ores: +${o.added} / ~${o.updated}`);
    } catch (err) {
      setSyncOresError(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncingOres(false);
    }
  };

  return (
    <Stack gap="lg">
      <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
      <Text>Welcome to the administration panel.</Text>

      <Stack gap="lg">
        <Group gap="xs">
          <Text size="md" fw={700} c="#CCAC31" style={sectionLabel}>Quick Actions</Text>
          <Divider flex={1} color="rgba(204,172,49,0.15)" />
        </Group>
        <Group gap="lg">
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/roles')}>
            Manage Roles
          </Button>
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/inventory')}>
            Manage Inventory
          </Button>
          <Button variant="outline" color="najaGold" onClick={() => navigate('/admin/permissions')}>
            Manage Permissions
          </Button>
        </Group>
      </Stack>

      <Stack gap="sm">
        <Group gap="xs" align="center">
          <Text size="md" fw={700} c="#CCAC31" style={sectionLabel}>Services</Text>
          <Divider flex={1} color="rgba(204,172,49,0.15)" />
        </Group>
        <Text>Pulls and syncs data from SC_Data: Blueprints, Ores</Text>
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
          <Button
            variant="outline"
            color="najaGold"
            leftSection={<IconRefresh size={16} />}
            loading={syncingOres}
            onClick={handleSyncOres}
          >
            Sync Ores
          </Button>
          {syncOresMsg   && <Text size="sm" c="var(--naja-teal)">{syncOresMsg}</Text>}
          {syncOresError && <Text size="sm" c="red">{syncOresError}</Text>}
        </Group>
      </Stack>
    </Stack>
  );
};

export default HomePageAdmin;
