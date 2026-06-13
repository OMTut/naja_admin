import { useState, useEffect } from 'react';
import {
  Stack, Group, Text, Button, Drawer, Divider,
  TextInput, ActionIcon, Box, Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconCategory } from '@tabler/icons-react';
import { drawerStyles, inputStyles } from '../../styles/mantine';
import { miscInventoryService } from '../../services/inventory/miscInventoryService';
import { CategorySelect } from '../inventory/CategorySelect';
import InventoryCategoryManagement from './InventoryCategoryManagement';
import type { InventoryCatalogItem, MiscCategory } from '../../types/inventory';

const MiscInventoryManagement = () => {
  const [catalog,    setCatalog]    = useState<InventoryCatalogItem[]>([]);
  const [categories, setCategories] = useState<MiscCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Add drawer
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [addName,       setAddName]       = useState('');
  const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError,      setAddError]      = useState('');

  // Edit drawer
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [editName,     setEditName]     = useState('');
  const [editCatId,    setEditCatId]    = useState<number | null>(null);
  const [editSubmit,   setEditSubmit]   = useState(false);
  const [editError,    setEditError]    = useState('');

  // Inline delete
  const [deleteId,     setDeleteId]     = useState<number | null>(null);
  const [deleteSubmit, setDeleteSubmit] = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  // Category drawer
  const [catDrawerOpen, { open: openCatDrawer, close: closeCatDrawer }] = useDisclosure(false);

  // Filter
  const [activeFilter, setActiveFilter] = useState<number | 'uncategorized' | null>(null);

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

  // ── Add ──────────────────────────────────────────────────────────────────────

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

  // ── Edit drawer ──────────────────────────────────────────────────────────────

  const startEdit = (item: InventoryCatalogItem) => {
    setEditingId(item.id);
    setEditName(item.display_name);
    setEditCatId(item.category?.id ?? null);
    setEditError('');
    openEdit();
  };

  const cancelEdit = () => { closeEdit(); setEditError(''); };

  const handleEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) { setEditError('Item name is required.'); return; }
    setEditSubmit(true); setEditError('');
    try {
      const updated = await miscInventoryService.updateCatalogItem(editingId, {
        display_name: editName.trim(),
        category_id:  editCatId ?? undefined,
      });
      setCatalog(prev => prev.map(c => c.id === editingId ? updated : c));
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update item.');
    } finally {
      setEditSubmit(false);
    }
  };

  // ── Inline delete ────────────────────────────────────────────────────────────

  const startDelete = (item: InventoryCatalogItem) => {
    setDeleteId(item.id);
    setDeleteError('');
    setEditingId(null);
  };

  const cancelDelete = () => { setDeleteId(null); setDeleteError(''); };

  const handleDelete = async (id: number) => {
    setDeleteSubmit(true); setDeleteError('');
    try {
      await miscInventoryService.deleteCatalogItem(id);
      setCatalog(prev => prev.filter(c => c.id !== id));
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete item.');
    } finally {
      setDeleteSubmit(false);
    }
  };

  // ── Grouping ─────────────────────────────────────────────────────────────────

  const groups = categories
    .map(cat => ({ cat, items: catalog.filter(i => i.category?.id === cat.id) }))
    .filter(g => g.items.length > 0);

  const uncategorized = catalog.filter(i => !i.category);

  // ── Row renderers ────────────────────────────────────────────────────────────

  const renderItem = (item: InventoryCatalogItem, idx: number) => (
    <Box
      key={item.id}
      px="sm"
      py="xs"
      className={deleteId !== item.id ? 'inventory-row' : undefined}
      style={{
        backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderRadius: 4,
      }}
    >
      {deleteId === item.id ? (
        <Stack
          gap={6}
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) cancelDelete(); }}
        >
          {item.total_quantity > 0 ? (
            <Text size="sm" c="orange">
              <Text span fw={700} c="var(--naja-gold)">{item.display_name}</Text> has{' '}
              <Text span fw={700}>{item.total_quantity}</Text> unit{item.total_quantity !== 1 ? 's' : ''} held by members.
              All holdings must be transferred, consumed, or removed first.
            </Text>
          ) : (
            <Text size="sm" c="var(--naja-text)">
              Remove <Text span fw={700} c="var(--naja-gold)">{item.display_name}</Text>? This cannot be undone.
            </Text>
          )}
          {deleteError && <Text size="xs" c="red">{deleteError}</Text>}
          <Group gap="xs">
            {item.total_quantity === 0 && (
              <Button size="compact-sm" variant="default" className="delete-btn" onClick={() => handleDelete(item.id)} loading={deleteSubmit}>
                Confirm
              </Button>
            )}
            <Button size="compact-sm" variant="outline" color="gray" onClick={cancelDelete} disabled={deleteSubmit} autoFocus>
              Cancel
            </Button>
          </Group>
        </Stack>

      ) : (
        <Group
          justify="space-between"
          align="center"
          onClick={() => startEdit(item)}
          style={{ cursor: 'pointer' }}
        >
          <Group>
            <Text size="md" c="var(--naja-text)">{item.display_name}</Text>
            {item.total_quantity > 0 && (
              <Text size="sm" c="dimmed">- Qty: {item.total_quantity}</Text>
            )}
          </Group>
          <Group gap="md">
            <ActionIcon
              variant="subtle"
              color="red"
              size="40px"
              onClick={e => { e.stopPropagation(); startDelete(item); }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Group>
      )}
    </Box>
  );

  if (loading) return <Text c="var(--naja-gold)">Loading...</Text>;

  return (
    <Stack gap="lg">
      {error && <Text c="red">{error}</Text>}

      <Group justify="flex-end">
        <Button variant="subtle" color="najaGold" leftSection={<IconCategory size={16} />} onClick={openCatDrawer}>
          Manage Categories
        </Button>
        <Button variant="outline" color="najaGold" leftSection={<IconPlus size={16} />} onClick={openAdd}>
          Add Item to Track
        </Button>
      </Group>

      {catalog.length === 0 ? (
        <Text c="var(--naja-teal)">No items defined yet. Add items to track above.</Text>
      ) : (
        <Stack gap="xl">
          {/* ── Filter select ──────────────────────────────────────────────────── */}
          <Select
            placeholder="Filter by category..."
            value={
              activeFilter === null ? null
              : activeFilter === 'uncategorized' ? '__uncategorized__'
              : String(activeFilter)
            }
            onChange={val => {
              setDeleteId(null);
              if (!val) setActiveFilter(null);
              else if (val === '__uncategorized__') setActiveFilter('uncategorized');
              else setActiveFilter(Number(val));
            }}
            data={[
              ...groups.map(({ cat }) => ({ value: String(cat.id), label: cat.name })),
              ...(uncategorized.length > 0 ? [{ value: '__uncategorized__', label: 'Uncategorized' }] : []),
            ]}
            clearable
            styles={inputStyles}
            style={{ maxWidth: 260 }}
          />

          {/* ── Filter buttons ─────────────────────────────────────────────────── */}


          {groups
            .filter(g => activeFilter === null || activeFilter === g.cat.id)
            .map(({ cat, items }) => (
            <Stack key={cat.id} gap="xs">
              <Group gap="xs" align="center">
                <Text size="lg" fw={700} tt="uppercase" c="var(--naja-gold)" style={{ letterSpacing: '0.05em' }}>
                  {cat.name}
                </Text>
                <Divider flex={1} color="rgba(204,172,49,0.15)" />
              </Group>
              <Stack gap={0}>
                {items.map((item, idx) => renderItem(item, idx))}
              </Stack>
            </Stack>
          ))}

          {uncategorized.length > 0 && (activeFilter === null || activeFilter === 'uncategorized') && (
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="xs" fw={700} tt="uppercase" c="var(--naja-teal)" style={{ letterSpacing: '0.05em' }}>
                  Uncategorized
                </Text>
                <Divider flex={1} color="rgba(204,172,49,0.15)" />
              </Group>
              <Stack gap={0}>
                {uncategorized.map((item, idx) => renderItem(item, idx))}
              </Stack>
            </Stack>
          )}
        </Stack>
      )}

      {/* ── Add Drawer ───────────────────────────────────────────────────────── */}
      <Drawer
        opened={addOpen}
        onClose={closeAdd}
        title={<Text fw={700} c="var(--naja-gold)" tt="uppercase" size="md" style={{ letterSpacing: '0.05em' }}>Add Item to Track</Text>}
        position="right"
        size="lg"
        styles={drawerStyles}
      >
        <Stack gap="sm" pt="xs">
          <TextInput
            label="Item Name"
            placeholder="e.g. Stims, Medpens, Keycard..."
            value={addName}
            onChange={e => setAddName(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            styles={inputStyles}
            required
            autoFocus
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
      </Drawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────────────── */}
      <Drawer
        opened={editOpen}
        onClose={cancelEdit}
        title={<Text fw={700} c="var(--naja-gold)" tt="uppercase" size="md" style={{ letterSpacing: '0.05em' }}>Edit Item</Text>}
        position="right"
        size="lg"
        styles={drawerStyles}
      >
        <Stack gap="sm" pt="xs">
          <TextInput
            label="Item Name"
            value={editName}
            onChange={e => { setEditName(e.currentTarget.value); setEditError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') cancelEdit(); }}
            styles={inputStyles}
            autoFocus
          />
          <CategorySelect
            categories={categories}
            value={editCatId}
            onChange={setEditCatId}
            onCreateCategory={handleCreateCategory}
          />
          {editError && <Text size="sm" c="red">{editError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={cancelEdit} disabled={editSubmit}>Cancel</Button>
            <Button variant="outline" color="najaGold" onClick={handleEdit} loading={editSubmit}>Save</Button>
          </Group>
        </Stack>
      </Drawer>

      <InventoryCategoryManagement
        opened={catDrawerOpen}
        onClose={closeCatDrawer}
        onCategoryChange={() => {
          Promise.all([
            miscInventoryService.getCatalog(),
            miscInventoryService.getCategories(),
          ]).then(([cat, cats]) => { setCatalog(cat); setCategories(cats); }).catch(() => {});
        }}
      />
    </Stack>
  );
};

export default MiscInventoryManagement;
