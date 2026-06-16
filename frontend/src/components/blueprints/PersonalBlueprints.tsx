import { useState, useEffect } from 'react';
import { Stack, Group, Text, Button, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { displayRows, blueprintCols } from '../../styles/mantine';
import { blueprintService } from '../../services/admin/blueprintService';
import { userBlueprintService } from '../../services/user/userBlueprintService';
import type { UserBlueprintEntry, BlueprintDetail, ItemCategory } from '../../types/blueprint';
import { matchesCategory } from '../../utils/categoryFilters';
import BlueprintDetailDrawer from './BlueprintDetailDrawer';
import AddBlueprintDrawer from './AddBlueprintDrawer';

interface PersonalBlueprintsProps {
  search: string;
  categoryFilter: string | null;
  sizeFilter: string | null;
  categories: ItemCategory[];
  addModalOpen: boolean;
  onCloseAdd: () => void;
}

const PersonalBlueprints = ({ search, categoryFilter, sizeFilter, categories, addModalOpen, onCloseAdd }: PersonalBlueprintsProps) => {
  const [myBlueprints, setMyBlueprints]   = useState<UserBlueprintEntry[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selectedBp, setSelectedBp]       = useState<BlueprintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState('');
  const [detailOpen, { open: openDetail, close: closeDetail }] = useDisclosure(false);

  useEffect(() => {
    userBlueprintService.getMyBlueprints()
      .then(mine => setMyBlueprints(mine))
      .catch(() => setError('Failed to load blueprints.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (uuid: string) => {
    await userBlueprintService.addBlueprint(uuid);
    const updated = await userBlueprintService.getMyBlueprints();
    setMyBlueprints(updated);
  };

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

  const handleRemove = async (uuid: string) => {
    try {
      await userBlueprintService.removeBlueprint(uuid);
      setMyBlueprints(prev => prev.filter(b => b.uuid !== uuid));
    } catch {
      setError('Failed to remove blueprint.');
    }
  };

  const myUuids = new Set(myBlueprints.map(b => b.uuid));

  const filteredMine = myBlueprints.filter(b => {
    const matchesSearch = !search || b.output_name?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory(b, categoryFilter, sizeFilter) && matchesSearch;
  });

  if (loading) return <Text c="najaGold">Loading blueprints...</Text>;

  return (
    <Stack gap="lg">

      {error && <Text c="red">{error}</Text>}

      {filteredMine.length === 0 ? (
        <Text c="najaTeal">
          {myBlueprints.length === 0 ? 'No blueprints in your collection yet.' : 'No blueprints match your filters.'}
        </Text>
      ) : (
        <Stack gap={0}>
          <Group gap="md" px="sm" pb="xs" style={displayRows.header}>
            {blueprintCols.personal.map(col => (
              <Box key={col.label} style={{ flex: col.flex }}>
                <span className="naja-col-label">{col.label}</span>
              </Box>
            ))}
          </Group>
          <Stack gap={0}>
            {filteredMine.map((bp, idx) => (
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
                    <Text size="sm" c="najaText.8">{bp.ingredient_count ?? '—'}</Text>
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
        onRemove={handleRemove}
      />

      <AddBlueprintDrawer
        opened={addModalOpen}
        onClose={onCloseAdd}
        onAdd={handleAdd}
        categories={categories}
        ownedUuids={myUuids}
      />

    </Stack>
  );
};

export default PersonalBlueprints;
