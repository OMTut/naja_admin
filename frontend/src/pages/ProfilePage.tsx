import { useState, useEffect } from 'react';
import { Stack, Group, Text, TextInput, Avatar, Paper, Badge, Divider, Button } from '@mantine/core';
import { IconBrandDiscord, IconRefresh } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks';
import { userService } from '../services/admin/userService';
import type { User } from '../types/user';
import { inputStyles } from '../styles/mantine';
import '../styles/ProfilePage.css';

const STATUS_COLORS: Record<string, string> = {
  approved: 'najaGold',
  pending:  'najaTeal',
  rejected: 'red',
  banned:   'dark',
};

const ProfilePage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: sessionUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedId = userId ? Number(userId) : sessionUser?.id;
  const isAppAdmin = sessionUser?.roles?.includes('App Admin') ?? false;
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    if (!resolvedId) return;
    userService.getUser(resolvedId)
      .then(setProfile)
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [resolvedId]);

  const handleResync = async () => {
    if (!resolvedId) return;
    setResyncing(true);
    setError(null);
    try {
      const { roles, discord_username, global_name, server_nickname } = await userService.resyncUser(resolvedId);
      setProfile((prev) => prev ? { ...prev, roles, discord_username, global_name, server_nickname } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resync failed.');
    } finally {
      setResyncing(false);
    }
  };

  const displayName = profile?.global_name || profile?.discord_username;
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : '?';

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  if (loading) return <Text c="najaGold">Loading profile...</Text>;

  return (
    <Stack gap="xl" maw={640}>
      <Group justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Profile</h1>
        {isAppAdmin && (
          <Button
            size="xs"
            leftSection={<IconRefresh size={14} />}
            loading={resyncing}
            onClick={handleResync}
          >
            Resync
          </Button>
        )}
      </Group>

      <Paper p="lg" className="profile-card">
        <Group gap="lg" align="flex-start">
          <Avatar size={72} radius="md" color="najaGold" className="profile-avatar">
            {initials}
          </Avatar>

          <Stack gap={6} style={{ flex: 1 }}>
            <Group gap="sm" align="center">
              <Text size="xl" fw={700} className="profile-username">{profile?.global_name || profile?.discord_username}</Text>
              <Badge color={STATUS_COLORS[profile?.status || ''] || 'gray'} variant="filled" size="sm">
                {profile?.status?.toUpperCase()}
              </Badge>
            </Group>

            <Group gap="xs" align="center">
              <IconBrandDiscord size={14} stroke={1.5} color="var(--naja-teal)" />
              <Text size="sm" className="profile-discord-id">ID: {profile?.discord_id}</Text>
            </Group>

            <Text size="sm" className="profile-member-since">Member since {joinedDate}</Text>
          </Stack>
        </Group>
      </Paper>

      <Divider color="rgba(204, 172, 49, 0.2)" />

      <Stack gap="md">
        <Text className="profile-section-label">Discord Info</Text>
        <Text className="profile-section-note">
          All fields below are sourced from Discord and refreshed automatically on each login.
        </Text>

        <div className="profile-fields-grid">
          <div className="profile-fields-left">
            <TextInput label="Username"        value={profile?.discord_username || ''}   disabled styles={inputStyles} />
            <TextInput label="Display Name"    value={profile?.global_name      || '—'}  disabled styles={inputStyles} />
            <TextInput label="Server Nickname" value={profile?.server_nickname  || '—'}  disabled styles={inputStyles} />
          </div>
          <div className="profile-fields-right">
            <TextInput label="Email" value={profile?.email || '—'} disabled styles={inputStyles} />
          </div>
        </div>

        {error && <Text c="red" size="sm">{error}</Text>}
      </Stack>
    </Stack>
  );
};

export default ProfilePage;
