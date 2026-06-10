import { useState, useEffect } from 'react';
import { IconUserShield, IconSword, IconLogicBuffer } from '@tabler/icons-react';
import { Stack, Text, Group, Paper, SimpleGrid } from '@mantine/core';
import { blueprintService, type OrgCategoryCounts } from '../services/admin/blueprintService';

const icons = {
  ShipComponents: IconLogicBuffer,
  ShipWeapons:    IconLogicBuffer,
  FPSWeapons:     IconSword,
  FPSArmor:       IconUserShield,
};

type StatKey = keyof typeof icons;

const statConfig: { title: string; icon: StatKey; key: keyof OrgCategoryCounts }[] = [
  { title: 'Ship Components', icon: 'ShipComponents', key: 'ship_components' },
  { title: 'Ship Weapons',    icon: 'ShipWeapons',    key: 'ship_weapons'    },
  { title: 'FPS Weapons',     icon: 'FPSWeapons',     key: 'fps_weapons'     },
  { title: 'FPS Armor',       icon: 'FPSArmor',       key: 'fps_armor'       },
];

const HomePage = () => {
  const [counts, setCounts] = useState<OrgCategoryCounts | null>(null);

  useEffect(() => {
    blueprintService.getOrgCategoryCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);

  const stats = statConfig.map((stat) => {
    const Icon = icons[stat.icon];
    return (
      <Paper
        key={stat.title}
        p="md"
        radius="md"
        style={{
          backgroundColor: 'var(--naja-surface)',
          border: '1px solid rgba(204, 172, 49, 0.2)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Text size="xs" c="var(--naja-text)" tt="uppercase" fw={700}>
            {stat.title}
          </Text>
          <Icon size={22} color="var(--naja-gold-alt)" stroke={1.5} />
        </Group>
        <Text size="42px" fw={700} c="var(--naja-gold-alt)" mt="sm">
          {counts ? counts[stat.key] : '—'}
        </Text>
      </Paper>
    );
  });

  return (
    <Stack gap="lg">

      <Stack gap="xs">
        <Text size="s" tt="uppercase" fw={700} c="var(--naja-text)" style={{ letterSpacing: '0.05em' }}>
          Org Blueprints Available
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 4, lg: 4 }}>
          {stats}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
};

export default HomePage;
