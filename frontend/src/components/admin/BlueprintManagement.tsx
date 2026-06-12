import { useState, useEffect } from 'react';
import {
  Stack, Group, Text, Table,
  Modal, Loader, List,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers } from '@tabler/icons-react';
import { tableStyles, modalStyles } from '../../styles/mantine';
import { blueprintService } from '../../services/admin/blueprintService';
import type { OrgBlueprint, BlueprintDetail, ItemCategory } from '../../types/blueprint';
import { matchesCategory } from '../../utils/categoryFilters';

const displayName = (u: { server_nickname: string | null; global_name: string | null; discord_username: string }) =>
  u.server_nickname ?? u.global_name ?? u.discord_username;

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

  if (loading) return <Text c="var(--naja-gold)">Loading org blueprints...</Text>;

  return (
    <Stack gap="lg">

      {error && <Text c="red">{error}</Text>}

      {filtered.length === 0 ? (
        <Text c="var(--naja-teal)">
          {orgBlueprints.length === 0
            ? 'No blueprints owned by any org member yet.'
            : 'No blueprints match your filters.'}
        </Text>
      ) : (
        <Table striped highlightOnHover styles={tableStyles}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Blueprint</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Members</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map(bp => (
              <Table.Tr
                key={bp.uuid}
                onClick={() => handleViewDetail(bp.uuid)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Td>{bp.output_name ?? bp.key ?? bp.uuid}</Table.Td>
                <Table.Td>
                  {bp.category_label
                    ? <Text size="sm" c="var(--naja-text)">{bp.category_label}</Text>
                    : <Text size="xs" c="dimmed">—</Text>}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <IconUsers size={14} color="var(--naja-gold)" />
                    <Text size="sm" c="var(--naja-gold)">{bp.owner_count}</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={detailOpen}
        onClose={closeDetail}
        title={selectedBp?.output_name ?? 'Blueprint Detail'}
        size="lg"
        styles={modalStyles}
      >
        {detailLoading && <Group justify="center" p="md"><Loader color="najaGold" size="sm" /></Group>}
        {detailError && <Text c="red">{detailError}</Text>}
        {selectedBp && !detailLoading && (
          <Stack gap="md">
            <Group gap="xl">
              {selectedBp.category_label && (
                <Stack gap={2}>
                  <Text size="xs" c="var(--naja-teal)" tt="uppercase" fw={700}>Category</Text>
                  <Text size="sm" c="var(--naja-text)">{selectedBp.category_label}</Text>
                </Stack>
              )}
              {selectedBp.craft_time_label && (
                <Stack gap={2}>
                  <Text size="xs" c="var(--naja-teal)" tt="uppercase" fw={700}>Craft Time</Text>
                  <Text size="sm" c="var(--naja-text)">{selectedBp.craft_time_label}</Text>
                </Stack>
              )}
              {selectedBp.ingredient_count != null && (
                <Stack gap={2}>
                  <Text size="xs" c="var(--naja-teal)" tt="uppercase" fw={700}>Ingredients</Text>
                  <Text size="sm" c="var(--naja-text)">{selectedBp.ingredient_count}</Text>
                </Stack>
              )}
            </Group>

            <Stack gap={4}>
              <Text size="xs" c="var(--naja-teal)" tt="uppercase" fw={700}>Org Owners ({selectedBp.owners.length})</Text>
              {selectedBp.owners.length === 0 ? (
                <Text size="sm" c="dimmed">None</Text>
              ) : (
                <Text size="sm" c="var(--naja-text)">
                  {selectedBp.owners.map(displayName).join(', ')}
                </Text>
              )}
            </Stack>

            {selectedBp.ingredients && selectedBp.ingredients.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="var(--naja-teal)" tt="uppercase" fw={700}>Ingredients</Text>
                <List size="sm" spacing={2}>
                  {selectedBp.ingredients.map((ing, i) => (
                    <List.Item key={i} style={{ color: 'var(--naja-text)' }}>
                      {ing.name}
                      {ing.quantity_scu != null && ` — ${ing.quantity_scu} SCU`}
                      {ing.quantity != null && ing.quantity_scu == null && ` × ${ing.quantity}`}
                    </List.Item>
                  ))}
                </List>
              </Stack>
            )}

            {selectedBp.ingredients === null && (
              <Text size="xs" c="var(--naja-teal)">Ingredient data unavailable (SC_Data offline).</Text>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default BlueprintManagement;
