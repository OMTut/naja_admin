import { useState, useEffect } from 'react';
import {
  Stack, Group, Text, Button, Table, Select, TextInput,
  Modal, ActionIcon, Loader, List,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconSearch } from '@tabler/icons-react';
import { tableStyles, modalStyles, inputStyles } from '../../styles/mantine';
import { blueprintService } from '../../services/admin/blueprintService';
import { userBlueprintService } from '../../services/user/userBlueprintService';
import type { UserBlueprintEntry, BlueprintSummary, BlueprintDetail, ItemCategory } from '../../types/blueprint';
import { buildCategoryOptions, matchesCategory } from '../../utils/categoryFilters';

interface PersonalBlueprintsProps {
  search: string;
  categoryFilter: string | null;
  sizeFilter: string | null;
  categories: ItemCategory[];
  addModalOpen: boolean;
  onCloseAdd: () => void;
}

const PersonalBlueprints = ({ search, categoryFilter, sizeFilter, categories, addModalOpen, onCloseAdd }: PersonalBlueprintsProps) => {
  const [myBlueprints, setMyBlueprints]     = useState<UserBlueprintEntry[]>([]);
  const [catalog, setCatalog]               = useState<BlueprintSummary[]>([]);
  const [loading, setLoading]               = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError]                   = useState('');
  const [catalogSearch, setCatalogSearch]   = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string | null>(null);
  const [addError, setAddError]             = useState('');
  const [selectedBp, setSelectedBp]         = useState<BlueprintDetail | null>(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [detailError, setDetailError]       = useState('');
  const [detailOpen, { open: openDetail, close: closeDetail }] = useDisclosure(false);

  useEffect(() => {
    userBlueprintService.getMyBlueprints()
      .then(mine => setMyBlueprints(mine))
      .catch(() => setError('Failed to load blueprints.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!addModalOpen || catalog.length > 0) return;
    setCatalogLoading(true);
    blueprintService.getBlueprints()
      .then(all => setCatalog(all))
      .catch(() => setAddError('Failed to load catalog.'))
      .finally(() => setCatalogLoading(false));
  }, [addModalOpen]);

  const handleAdd = async (uuid: string) => {
    try {
      await userBlueprintService.addBlueprint(uuid);
      const updated = await userBlueprintService.getMyBlueprints();
      setMyBlueprints(updated);
      setAddError('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add blueprint.');
    }
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

  const filteredCatalog = catalog.filter(b => {
    const notOwned = !myUuids.has(b.uuid);
    const matchesSearch = !catalogSearch || b.output_name?.toLowerCase().includes(catalogSearch.toLowerCase());
    return notOwned && matchesCategory(b, catalogCategory) && matchesSearch;
  });

  const categoryOptions = buildCategoryOptions(categories);

  if (loading) return <Text c="var(--naja-gold)">Loading blueprints...</Text>;

  return (
    <Stack gap="lg">

      {error && <Text c="red">{error}</Text>}

      {filteredMine.length === 0 ? (
        <Text c="var(--naja-teal)">
          {myBlueprints.length === 0 ? 'No blueprints in your collection yet.' : 'No blueprints match your filters.'}
        </Text>
      ) : (
        <Table striped highlightOnHover styles={tableStyles}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Blueprint</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Ingredients</Table.Th>
              <Table.Th style={{ width: 60 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredMine.map(bp => (
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
                <Table.Td>{bp.ingredient_count ?? '—'}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={e => { e.stopPropagation(); handleRemove(bp.uuid); }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
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
          </Stack>
        )}
      </Modal>

      <Modal
        opened={addModalOpen}
        onClose={() => { onCloseAdd(); setCatalogSearch(''); setCatalogCategory(null); setAddError(''); }}
        title="Add Blueprint"
        size="lg"
        styles={modalStyles}
      >
        <Stack gap="sm">
          {addError && <Text size="sm" c="red">{addError}</Text>}
          <Group gap="sm">
            <TextInput
              placeholder="Search catalog..."
              leftSection={<IconSearch size={14} />}
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.currentTarget.value)}
              styles={inputStyles}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="All Categories"
              data={categoryOptions}
              value={catalogCategory}
              onChange={setCatalogCategory}
              styles={inputStyles}
              style={{ width: 200 }}
              clearable
            />
          </Group>

          {catalogLoading ? (
            <Group justify="center" p="md"><Loader color="najaGold" size="sm" /></Group>
          ) : (
            <Table highlightOnHover styles={tableStyles} style={{ maxHeight: 400, overflowY: 'auto', display: 'block' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Blueprint</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th style={{ width: 80 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredCatalog.map(bp => (
                  <Table.Tr key={bp.uuid}>
                    <Table.Td>{bp.output_name ?? bp.key ?? bp.uuid}</Table.Td>
                    <Table.Td>
                      {bp.category_label
                        ? <Text size="sm" c="var(--naja-text)">{bp.category_label}</Text>
                        : <Text size="xs" c="dimmed">—</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Button size="xs" variant="outline" color="najaGold" onClick={() => handleAdd(bp.uuid)}>
                        Add
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {filteredCatalog.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text size="sm" c="var(--naja-teal)" ta="center">No blueprints found.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
};

export default PersonalBlueprints;
