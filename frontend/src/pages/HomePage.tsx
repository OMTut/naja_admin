import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUserShield, IconSword, IconLogicBuffer } from '@tabler/icons-react';
import { Stack, Text, Group, Paper, SimpleGrid } from '@mantine/core';
import { blueprintService, type OrgCategoryCounts } from '../services/admin/blueprintService';
import { STAT_KEY_TO_CATEGORY } from '../utils/categoryFilters';

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
  const navigate = useNavigate();

  useEffect(() => {
    blueprintService.getOrgCategoryCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);

  const handleCardClick = (statKey: keyof OrgCategoryCounts) => {
    const cat = STAT_KEY_TO_CATEGORY[statKey];
    navigate(`/blueprints?view=org&cat=${cat}`);
  };

  const stats = statConfig.map((stat) => {
    const Icon = icons[stat.icon];
    return (
      <Paper
        key={stat.title}
        p="md"
        radius="md"
        onClick={() => handleCardClick(stat.key)}
        style={{
          backgroundColor: 'var(--naja-sidebar)',
          border: '1px solid rgba(204, 172, 49, 0.2)',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(204, 172, 49, 0.6)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(204, 172, 49, 0.2)')}
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
