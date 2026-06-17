import { useState, useEffect } from 'react';
import { Stack, Group, Button, Box, Select, TextInput, Drawer, Loader } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { inputStyles, drawerClassNames, displayRows, blueprintCols } from '../../styles/mantine';
import { blueprintService } from '../../services/admin/blueprintService';
import type { BlueprintSummary, ItemCategory } from '../../types/blueprint';
import { buildCategoryOptions, matchesCategory } from '../../utils/categoryFilters';

interface AddBlueprintDrawerProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (uuid: string) => Promise<void>;
  categories: ItemCategory[];
  ownedUuids: Set<string>;
}

const AddBlueprintDrawer = ({ opened, onClose, onAdd, categories, ownedUuids }: AddBlueprintDrawerProps) => {
  const [catalog, setCatalog]               = useState<BlueprintSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch]   = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string | null>(null);
  const [addError, setAddError]             = useState('');

  useEffect(() => {
    if (!opened || catalog.length > 0) return;
    setCatalogLoading(true);
    blueprintService.getBlueprints()
      .then(all => setCatalog(all))
      .catch(() => setAddError('Failed to load catalog.'))
      .finally(() => setCatalogLoading(false));
  }, [opened]);

  const handleAdd = async (uuid: string) => {
    try {
      await onAdd(uuid);
      setAddError('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add blueprint.');
    }
  };

  const handleClose = () => {
    onClose();
    setCatalogSearch('');
    setCatalogCategory(null);
    setAddError('');
  };

  const categoryOptions = buildCategoryOptions(categories);

  const filteredCatalog = catalog.filter(b => {
    const notOwned = !ownedUuids.has(b.uuid);
    const matchesSearch = !catalogSearch || b.output_name?.toLowerCase().includes(catalogSearch.toLowerCase());
    return notOwned && matchesCategory(b, catalogCategory) && matchesSearch;
  });

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title="Add Blueprint"
      position="right"
      size="lg"
      classNames={drawerClassNames}
    >
      <Stack gap="sm">
        {addError && <span className="naja-drawer-error">{addError}</span>}
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
        ) : filteredCatalog.length === 0 ? (
          <span className="naja-catalog-empty">No blueprints found.</span>
        ) : (
          <Stack gap={0}>
            <Group gap="md" px="sm" pb="xs" style={displayRows.header}>
              {blueprintCols.catalog.map(col => (
                <Box key={col.label} style={{ flex: col.flex }}>
                  <span className="naja-col-label">{col.label}</span>
                </Box>
              ))}
              <Box style={{ width: 60 }} />
            </Group>
            <Stack gap={0}>
              {filteredCatalog.map((bp, idx) => (
                <Box key={bp.uuid} px="sm" py="xs" style={displayRows.row(idx)}>
                  <Group gap="md" align="center" wrap="nowrap">
                    <Box style={{ flex: 4, minWidth: 0 }}>
                      <span className="naja-catalog-text">{bp.output_name ?? bp.key ?? bp.uuid}</span>
                    </Box>
                    <Box style={{ flex: 2, minWidth: 0 }}>
                      {bp.category_label
                        ? <span className="naja-catalog-text">{bp.category_label}</span>
                        : <span className="naja-detail-empty">—</span>}
                    </Box>
                    <Box style={{ width: 60 }}>
                      <Button size="xs" onClick={() => handleAdd(bp.uuid)}>Add</Button>
                    </Box>
                  </Group>
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
};

export default AddBlueprintDrawer;
