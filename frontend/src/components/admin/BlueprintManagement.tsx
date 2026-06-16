import { useState, useEffect } from 'react';
import { Stack, Group, Text, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers } from '@tabler/icons-react';
import BlueprintDetailDrawer from '../blueprints/BlueprintDetailDrawer';
import { displayRows, blueprintCols } from '../../styles/mantine';
import { blueprintService } from '../../services/admin/blueprintService';
import type { OrgBlueprint, BlueprintDetail, ItemCategory } from '../../types/blueprint';
import { matchesCategory } from '../../utils/categoryFilters';

interface BlueprintManagementProps {
  search?: string;
  categoryFilter?: string | null;
  sizeFilter?: string | null;
  categories?: ItemCategory[];
}

const BlueprintManagement = ({ search = '', categoryFilter = null, sizeFilter = null }: BlueprintManagementProps) => {
  const [orgBlueprints, setOrgBlueprints] = useState<OrgBlueprint[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selectedBp, setSelectedBp]       = useState<BlueprintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState('');
  const [detailOpen, { open: openDetail, close: closeDetail }] = useDisclosure(false);

  useEffect(() => {
    blueprintService.getOrgBlueprints()
      .then(org => setOrgBlueprints(org))
      .catch(() => setError('Failed to load org blueprints.'))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetail = async (uuid: string) => {
    setDetailError('');
    setSelectedBp(null);
    openDetail();
    setDetailLoading(true);
    try {
      const detail = await blueprintService.getBlueprint(uuid);
      setSelectedBp(detail);
    } catch {
      setDetailError('Failed to load blueprint details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = orgBlueprints.filter(b => {
    const matchesSearch = !search || b.output_name?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory(b, categoryFilter, sizeFilter) && matchesSearch;
  });

  if (loading) return <Text c="najaGold">Loading org blueprints...</Text>;

  return (
    <Stack gap="lg">

      {error && <Text c="red">{error}</Text>}

      {filtered.length === 0 ? (
        <Text c="najaTeal">
          {orgBlueprints.length === 0
            ? 'No blueprints owned by any org member yet.'
            : 'No blueprints match your filters.'}
        </Text>
      ) : (
        <Stack gap={0}>
          <Group gap="md" px="sm" pb="xs" style={displayRows.header}>
            {blueprintCols.org.map(col => (
              <Box key={col.label} style={{ flex: col.flex }}>
                <span className="naja-col-label">{col.label}</span>
              </Box>
            ))}
          </Group>
          <Stack gap={0}>
            {filtered.map((bp, idx) => (
              <Box
                key={bp.uuid}
                px="sm"
                py="xs"
                className="inventory-row"
                style={displayRows.row(idx)}
              >
                <Group gap="md" align="center" wrap="nowrap" onClick={() => handleViewDetail(bp.uuid)} style={{ cursor: 'pointer' }}>
                  <Box style={{ flex: 4, minWidth: 0 }}>
                    <Text size="md" truncate>{bp.output_name ?? bp.key ?? bp.uuid}</Text>
                  </Box>
                  <Box style={{ flex: 2, minWidth: 0 }}>
                    {bp.category_label
                      ? <Text size="sm" c="najaText.8" truncate>{bp.category_label}</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Group gap="xs">
                      <IconUsers size={14} color="var(--naja-gold-alt)" />
                      <Text size="sm" c="najaGoldAlt.7">{bp.owner_count}</Text>
                    </Group>
                  </Box>
                </Group>
              </Box>
            ))}
          </Stack>
        </Stack>
      )}

      <BlueprintDetailDrawer
        opened={detailOpen}
        onClose={closeDetail}
        blueprint={selectedBp}
        loading={detailLoading}
        error={detailError}
      />
    </Stack>
  );
};

export default BlueprintManagement;
