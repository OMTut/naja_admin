import { useState, useEffect } from 'react';
import {
  Drawer, Stack, Group, Text, Avatar, Badge,
  TextInput, Divider, Button, Loader,
} from '@mantine/core';
import { IconBrandDiscord, IconRefresh } from '@tabler/icons-react';
import { userService } from '../../services/admin/userService';
import { useAuth } from '../../hooks';
import { drawerClassNames, inputStyles } from '../../styles/mantine';
import type { User } from '../../types/user';

const STATUS_BADGE_COLORS: Record<string, string> = {
  approved: 'najaGold',
  pending:  'yellow',
  rejected: 'red',
  banned:   'gray',
};

interface Props {
  opened: boolean;
  onClose: () => void;
  userId: number | null;
}

const UserProfileDrawer = ({ opened, onClose, userId }: Props) => {
  const { user: sessionUser } = useAuth();
  const isAppAdmin = sessionUser?.roles?.includes('App Admin') ?? false;

  const [profile,   setProfile]   = useState<User | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    if (!opened || !userId) return;
    setProfile(null);
    setError(null);
    setLoading(true);
    userService.getUser(userId)
      .then(setProfile)
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [opened, userId]);

  const handleResync = async () => {
    if (!profile) return;
    setResyncing(true); setError(null);
    try {
      const { roles, discord_username, global_name, server_nickname } = await userService.resyncUser(profile.id);
      setProfile(prev => prev ? { ...prev, roles, discord_username, global_name, server_nickname } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resync failed.');
    } finally {
      setResyncing(false);
    }
  };

  const initials = profile
    ? (profile.global_name || profile.discord_username).slice(0, 2).toUpperCase()
    : '?';

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} c="najaGold" tt="uppercase" size="md">
          {profile ? (profile.server_nickname || profile.global_name || profile.discord_username) : 'Profile'}
        </Text>
      }
      position="right"
      size="lg"
      classNames={drawerClassNames}
    >
      {loading ? (
        <Loader size="sm" color="najaGold" mt="md" />
      ) : error && !profile ? (
        <Text c="red" size="sm" mt="md">{error}</Text>
      ) : profile ? (
        <Stack gap="md" pt="xs">
          <Group gap="md" align="flex-start">
            <Avatar size={64} radius="md" color="najaGold">{initials}</Avatar>
            <Stack gap={4}>
              <Group gap="sm" align="center">
                <Text size="lg" fw={700}>
                  {profile.global_name || profile.discord_username}
                </Text>
                <Badge color={STATUS_BADGE_COLORS[profile.status] || 'gray'} variant="filled" size="sm">
                  {profile.status.toUpperCase()}
                </Badge>
              </Group>
              <Group gap="xs" align="center">
                <IconBrandDiscord size={13} stroke={1.5} color="var(--naja-teal)" />
                <Text size="xs" c="dimmed">ID: {profile.discord_id}</Text>
              </Group>
              <Text size="xs" c="dimmed">Member since {joinedDate}</Text>
            </Stack>
          </Group>

          <Divider color="rgba(204,172,49,0.2)" />

          <TextInput label="Username"        value={profile.discord_username || ''}  disabled styles={inputStyles} />
          <TextInput label="Display Name"    value={profile.global_name      || '—'} disabled styles={inputStyles} />
          <TextInput label="Server Nickname" value={profile.server_nickname  || '—'} disabled styles={inputStyles} />
          <TextInput label="Email"           value={profile.email            || '—'} disabled styles={inputStyles} />

          <Text size="xs" c="najaTeal">
            All fields above are sourced from Discord and refreshed on each login.
          </Text>

          {error && <Text size="sm" c="red">{error}</Text>}

          {isAppAdmin && (
            <Button
              size="compact-sm"
              leftSection={<IconRefresh size={14} />}
              loading={resyncing}
              onClick={handleResync}
              style={{ alignSelf: 'flex-start' }}
            >
              Resync from Discord
            </Button>
          )}
        </Stack>
      ) : null}
    </Drawer>
  );
};

export default UserProfileDrawer;
