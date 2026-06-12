import { useState, useEffect } from 'react';
import {
  Stack, Group, Text, Table, Button, Modal,
  TextInput, ActionIcon, Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconEdit, IconCategory } from '@tabler/icons-react';
import { tableStyles, modalStyles, inputStyles } from '../../styles/mantine';
import { miscInventoryService } from '../../services/inventory/miscInventoryService';
import { CategorySelect } from '../inventory/CategorySelect';
import InventoryCategoryManagement from './InventoryCategoryManagement';
import type { InventoryCatalogItem, MiscCategory } from '../../types/inventory';

const MiscInventoryManagement = () => {
  const [catalog,    setCatalog]    = useState<InventoryCatalogItem[]>([]);
  const [categories, setCategories] = useState<MiscCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Add modal
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [addName,       setAddName]       = useState('');
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError,      setAddError]      = useState('');

  // Edit modal
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editTarget,     setEditTarget]     = useState<InventoryCatalogItem | null>(null);
  const [editName,       setEditName]       = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError,      setEditError]      = useState('');

  // Category drawer
  const [catDrawerOpen, { open: openCatDrawer, close: closeCatDrawer }] = useDisclosure(false);

  // Delete confirm
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteTarget,     setDeleteTarget]     = useState<InventoryCatalogItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError,      setDeleteError]      = useState('');

  useEffect(() => {
    Promise.all([
      miscInventoryService.getCatalog(),
      miscInventoryService.getCategories(),
    ])
      .then(([cat, cats]) => { setCatalog(cat); setCategories(cats); })
      .catch(() => setError('Failed to load catalog.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateCategory = async (name: string): Promise<MiscCategory> => {
    const cat = await miscInventoryService.createCategory(name);
    setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    return cat;
  };

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!addName.trim()) { setAddError('Item name is required.'); return; }
    setAddSubmitting(true); setAddError('');
    try {
      const item = await miscInventoryService.createCatalogItem({
        display_name: addName.trim(),
        category_id:  addCategoryId ?? undefined,
      });
      setCatalog(prev => [...prev, item].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      closeAdd();
      setAddName(''); setAddCategoryId(null);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add item.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const openEditFor = (item: InventoryCatalogItem) => {
    setEditTarget(item);
    setEditName(item.display_name);
    setEditCategoryId(item.category?.id ?? null);
    setEditError('');
    openEdit();
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editName.trim()) { setEditError('Item name is required.'); return; }
    setEditSubmitting(true); setEditError('');
    try {
      const updated = await miscInventoryService.updateCatalogItem(editTarget.id, {
        display_name: editName.trim(),
        category_id:  editCategoryId ?? undefined,
      });
      setCatalog(prev => prev.map(c => c.id === updated.id ? updated : c));
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update item.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDeleteFor = (item: InventoryCatalogItem) => {
    setDeleteTarget(item);
    setDeleteError('');
    openDelete();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true); setDeleteError('');
    try {
      await miscInventoryService.deleteCatalogItem(deleteTarget.id);
      setCatalog(prev => prev.filter(c => c.id !== deleteTarget.id));
      closeDelete();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete item.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) return <Text c="var(--naja-gold)">Loading...</Text>;

  return (
    <Stack gap="lg">
      {error && <Text c="red">{error}</Text>}

      <Group justify="flex-end">
        <Button
          variant="subtle"
          color="najaGold"
          leftSection={<IconCategory size={16} />}
          onClick={openCatDrawer}
        >
          Manage Categories
        </Button>
        <Button
          variant="outline"
          color="najaGold"
          leftSection={<IconPlus size={16} />}
          onClick={openAdd}
        >
          Add Item to Track
        </Button>
      </Group>

      {catalog.length === 0 ? (
        <Text c="var(--naja-teal)">No items defined yet. Add items to track above.</Text>
      ) : (
        <Table striped highlightOnHover styles={tableStyles}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Org Qty</Table.Th>
              <Table.Th>Holders</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {catalog.map(item => (
              <Table.Tr key={item.id}>
                <Table.Td><Text size="sm" c="var(--naja-text)">{item.display_name}</Text></Table.Td>
                <Table.Td>
                  {item.category
                    ? <Badge variant="outline" color="najaGold" size="sm">{item.category.name}</Badge>
                    : <Text size="sm" c="dimmed">—</Text>}
                </Table.Td>
                <Table.Td><Text size="sm" c="var(--naja-text)">{item.total_quantity}</Text></Table.Td>
                <Table.Td><Text size="sm" c="var(--naja-text)">{item.holder_count}</Text></Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" color="najaGold" size="sm" onClick={() => openEditFor(item)}>
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => openDeleteFor(item)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      <Modal opened={addOpen} onClose={closeAdd} title="Add Item to Track" size="sm" styles={modalStyles}>
        <Stack gap="sm">
          <TextInput
            label="Item Name"
            placeholder="e.g. Stims, Medpens, Keycard..."
            value={addName}
            onChange={e => setAddName(e.currentTarget.value)}
            styles={inputStyles}
            required
          />
          <CategorySelect
            categories={categories}
            value={addCategoryId}
            onChange={setAddCategoryId}
            onCreateCategory={handleCreateCategory}
          />
          {addError && <Text size="sm" c="red">{addError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeAdd} disabled={addSubmitting}>Cancel</Button>
            <Button variant="outline" color="najaGold" onClick={handleAdd} loading={addSubmitting}>Add</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <Modal opened={editOpen} onClose={closeEdit} title="Edit Item" size="sm" styles={modalStyles}>
        <Stack gap="sm">
          <TextInput
            label="Item Name"
            value={editName}
            onChange={e => setEditName(e.currentTarget.value)}
            styles={inputStyles}
            required
          />
          <CategorySelect
            categories={categories}
            value={editCategoryId}
            onChange={setEditCategoryId}
            onCreateCategory={handleCreateCategory}
          />
          {editError && <Text size="sm" c="red">{editError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeEdit} disabled={editSubmitting}>Cancel</Button>
            <Button variant="outline" color="najaGold" onClick={handleEdit} loading={editSubmitting}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      <Modal opened={deleteOpen} onClose={closeDelete} title="Remove Item" size="sm" styles={modalStyles}>
        <Stack gap="md">
          {(deleteTarget?.total_quantity ?? 0) > 0 ? (
            <Text size="sm" c="var(--naja-text)">
              <Text span fw={700} c="var(--naja-gold)">{deleteTarget?.display_name}</Text> has{' '}
              <Text span fw={700}>{deleteTarget?.total_quantity}</Text> units currently held by org members.
              All holdings must be transferred, consumed or removed before this item can be deleted.
            </Text>
          ) : (
            <Text size="sm" c="var(--naja-text)">
              Remove <Text span fw={700} c="var(--naja-gold)">{deleteTarget?.display_name}</Text> from
              the tracked items list? This cannot be undone.
            </Text>
          )}
          {deleteError && <Text size="sm" c="red">{deleteError}</Text>}
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={closeDelete} disabled={deleteSubmitting}>Cancel</Button>
            <Button
              variant="outline"
              color="red"
              onClick={handleDelete}
              loading={deleteSubmitting}
              disabled={(deleteTarget?.total_quantity ?? 0) > 0}
            >
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
      <InventoryCategoryManagement
        opened={catDrawerOpen}
        onClose={closeCatDrawer}
        onCategoryChange={() => {
          miscInventoryService.getCategories().then(setCategories).catch(() => {});
        }}
      />
    </Stack>
  );
};

export default MiscInventoryManagement;
