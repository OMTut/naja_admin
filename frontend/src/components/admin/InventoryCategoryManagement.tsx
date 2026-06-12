import { useState, useEffect } from 'react';
import {
  Drawer, Stack, Group, Text, TextInput, Button, ActionIcon,
  Divider, Loader, Badge, Box,
} from '@mantine/core';
import { IconPlus, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { drawerStyles, inputStyles } from '../../styles/mantine';
import { miscInventoryService } from '../../services/inventory/miscInventoryService';
import type { MiscCategory } from '../../types/inventory';

interface Props {
  opened:           boolean;
  onClose:          () => void;
  onCategoryChange: () => void;
}

const InventoryCategoryManagement = ({ opened, onClose, onCategoryChange }: Props) => {
  const [categories,   setCategories]   = useState<MiscCategory[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // Add
  const [addName,      setAddName]      = useState('');
  const [addSubmit,    setAddSubmit]    = useState(false);
  const [addError,     setAddError]     = useState('');

  // Inline edit
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [editName,     setEditName]     = useState('');
  const [editSubmit,   setEditSubmit]   = useState(false);
  const [editError,    setEditError]    = useState('');

  // Inline delete confirm
  const [deleteId,     setDeleteId]     = useState<number | null>(null);
  const [deleteSubmit, setDeleteSubmit] = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    setError('');
    miscInventoryService.getCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setLoading(false));
  }, [opened]);

  // ── Add ──────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!addName.trim()) { setAddError('Name is required.'); return; }
    setAddSubmit(true); setAddError('');
    try {
      const cat = await miscInventoryService.createCategory(addName.trim());
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setAddName('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add category.');
    } finally {
      setAddSubmit(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (cat: MiscCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditError('');
    setDeleteId(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditError(''); };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) { setEditError('Name is required.'); return; }
    setEditSubmit(true); setEditError('');
    try {
      const updated = await miscInventoryService.updateCategory(id, editName.trim());
      setCategories(prev =>
        prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update category.');
    } finally {
      setEditSubmit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const startDelete = (cat: MiscCategory) => {
    setDeleteId(cat.id);
    setDeleteError('');
    setEditingId(null);
  };

  const cancelDelete = () => { setDeleteId(null); setDeleteError(''); };

  const handleDelete = async (id: number) => {
    setDeleteSubmit(true); setDeleteError('');
    try {
      await miscInventoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setDeleteSubmit(false);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={() => { onClose(); onCategoryChange(); }}
      title={<Text fw={700} c="var(--naja-gold)" tt="uppercase" size="md" style={{ letterSpacing: '0.05em' }}>Manage Inventory Categories</Text>}
      position="right"
      size="lg"
      styles={drawerStyles}
    >
      <Stack gap="lg" pt="xs">

        {/* ── Add ────────────────────────────────────────────────────────────── */}
        <Stack gap="xs">
          <Group gap="xs" align="flex-end">
            <TextInput
              placeholder="New category name..."
              value={addName}
              onChange={e => { setAddName(e.currentTarget.value); setAddError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              styles={inputStyles}
              style={{ flex: 1 }}
            />
            <Button
              variant="outline"
              color="najaGold"
              leftSection={<IconPlus size={14} />}
              onClick={handleAdd}
              loading={addSubmit}
            >
              Add
            </Button>
          </Group>
          {addError && <Text size="xs" c="red">{addError}</Text>}
        </Stack>

        <Divider color="rgba(204, 172, 49, 0.2)" />

        {/* ── List ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <Loader size="xs" color="najaGold" />
        ) : error ? (
          <Text size="sm" c="red">{error}</Text>
        ) : categories.length === 0 ? (
          <Text size="sm" c="dimmed">No categories yet.</Text>
        ) : (
          <Stack gap={0}>
            {categories.map((cat, idx) => (
              <Box
                key={cat.id}
                px="sm"
                py="xs"
                className={editingId !== cat.id && deleteId !== cat.id ? 'inventory-row' : undefined}
                style={{
                  backgroundColor: idx % 2 === 0
                    ? 'rgba(255,255,255,0.03)'
                    : 'transparent',
                  borderRadius: 4,
                }}
              >
                {editingId === cat.id ? (
                  // ── Inline edit row ─────────────────────────────────────────
                  <Stack gap={4} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) cancelEdit(); }}>
                    <Group gap="xs" align="flex-end">
                      <TextInput
                        value={editName}
                        onChange={e => { setEditName(e.currentTarget.value); setEditError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') cancelEdit(); }}
                        styles={inputStyles}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      <ActionIcon variant="outline" color="najaGold" size="lg" onClick={() => handleEdit(cat.id)} loading={editSubmit}>
                        <IconCheck size={14} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="gray" size="lg" onClick={cancelEdit} disabled={editSubmit}>
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                    {editError && <Text size="xs" c="red">{editError}</Text>}
                  </Stack>

                ) : deleteId === cat.id ? (
                  // ── Inline delete confirm row ───────────────────────────────
                  <Stack gap={6} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) cancelDelete(); }}>
                    {cat.item_count > 0 ? (
                      <Text size="md" c="orange">
                        This category has{' '}
                        <Text span fw={700}>{cat.item_count}</Text> item{cat.item_count !== 1 ? 's' : ''} assigned.
                        They will become uncategorized.
                      </Text>
                    ) : (
                      <Text size="md" c="var(--naja-text)">
                        Remove <Text span fw={500} c="var(--naja-gold)">{cat.name}</Text>? This cannot be undone.
                      </Text>
                    )}
                    {deleteError && <Text size="md" c="red">{deleteError}</Text>}
                    <Group gap="100px">
                      <Button size="compact-md" variant="outline" color="red" onClick={() => handleDelete(cat.id)} loading={deleteSubmit}>
                        Confirm
                      </Button>
                      <Button size="compact-md" variant="outline" color="gray" onClick={cancelDelete} disabled={deleteSubmit} autoFocus>
                        Cancel
                      </Button>
                    </Group>
                  </Stack>

                ) : (
                  // ── Normal row — click anywhere to edit ─────────────────────
                  <Group
                    justify="space-between"
                    align="center"
                    onClick={() => startEdit(cat)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Group gap="md">
                      <Text size="lg" c="var(--naja-text)">{cat.name}</Text>
                      {cat.item_count > 0 && (
                        <Badge variant="outline" color="najaGold" size="md">{cat.item_count}</Badge>
                      )}
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="40px"
                      onClick={e => { e.stopPropagation(); startDelete(cat); }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
};

export default InventoryCategoryManagement;
