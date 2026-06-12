import { Paper, Group, Text } from '@mantine/core';

interface InventorySummaryCardProps {
  title:   string;
  value:   string | number;
  icon:    React.FC<{ size?: number; stroke?: number; color?: string }>;
  onClick: () => void;
}

const InventorySummaryCard = ({ title, value, icon: Icon, onClick }: InventorySummaryCardProps) => (
  <Paper
    p="md"
    radius="md"
    onClick={onClick}
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
        {title}
      </Text>
      <Icon size={22} color="var(--naja-gold-alt)" stroke={1.5} />
    </Group>
    <Text size="42px" fw={700} c="var(--naja-gold-alt)" mt="sm">
      {value}
    </Text>
  </Paper>
);

export default InventorySummaryCard;
