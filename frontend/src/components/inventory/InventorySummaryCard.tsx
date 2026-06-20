import { Paper, Text } from '@mantine/core';

interface InventorySummaryCardProps {
  title:   string;
  value:   string | number;
  onClick: () => void;
}

const InventorySummaryCard = ({ title, value, onClick }: InventorySummaryCardProps) => (
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
    <Text size="xs" tt="uppercase" fw={700}>
      {title}
    </Text>
    <Text size="42px" fw={700} c="najaGoldAlt" mt="sm">
      {value}
    </Text>
  </Paper>
);

export default InventorySummaryCard;
