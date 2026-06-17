import { useState, useEffect } from 'react';
import {
  Stack, Group, Text, Table, Button, Modal,
  TextInput, NumberInput, Autocomplete,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { tableStyles, modalStyles, inputStyles } from '../../styles/mantine';
import { useAuth } from '../../hooks';
import { resourceInventoryService } from '../../services/inventory/resourceInventoryService';
import { oreService } from '../../services/admin/oreService';
import type { ResourceInventoryEntry } from '../../types/inventory';

const ADMIN_ROLES = ['Role 1', 'App Admin'];

const userName = (u: ResourceInventoryEntry['held_by']) =>
  u ? (u.server_nickname ?? u.global_name ?? u.discord_username) : '—';

const ResourceInventoryTable = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.some(r => ADMIN_ROLES.includes(r)) ?? false;

  const [entries, setEntries]     = useState<ResourceInventoryEntry[]>([]);
  const [oreNames, setOreNames]   = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Add modal
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [addOreName, setAddOreName]     = useState('');
  const [addQuality, setAddQuality]     = useState<number | string>('');
  const [addScu, setAddScu]             = useState<number | string>('');
  const [addLocation, setAddLocation]   = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError]         = useState('');

  // Detail/edit modal
  const [detailOpen, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [selected, setSelected]           = useState<ResourceInventoryEntry | null>(null);
  const [editing, setEditing]             = useState(false);
  const [editCurrentScu, setEditCurrentScu] = useState<number | string>('');
  const [editQuality, setEditQuality]     = useState<number | string>('');
  const [editLocation, setEditLocation]   = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError]         = useState('');

  useEffect(() => {
    Promise.all([
      resourceInventoryService.getAll(),
      oreService.getOres(),
    ])
      .then(([inv, ores]) => {
        setEntries(inv);
        setOreNames(ores.map(o => o.display_name));
      })
      .catch(() => setError('Failed to load inventory.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!addOreName.trim())            { setAddError('Resource name is required.'); return; }
    if (addQuality === '')             { setAddError('Quality is required.'); return; }
    if (!addScu || Number(addScu) <= 0){ setAddError('SCU must be greater than 0.'); return; }
    if (!addLocation.trim())           { setAddError('Location is required.'); return; }
    setAddSubmitting(true);
    setAddError('');
    try {
      const entry = await resourceInventoryService.add({
        ore_name:     addOreName.trim(),
        quality:      Number(addQuality),
        original_scu: Number(addScu),
        location:     addLocation.trim(),
      });
      setEntries(prev => [entry, ...prev]);
      closeAdd();
      setAddOreName(''); setAddQuality(''); setAddScu(''); setAddLocation('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add entry.');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleRowClick = (entry: ResourceInventoryEntry) => {
    setSelected(entry);
    setEditing(false);
    setEditCurrentScu(entry.current_scu);
    setEditQuality(entry.quality ?? '');
    setEditLocation(entry.location ?? '');
    setEditError('');
    openDetail();
  };

  const canEdit = selected
    ? (user?.id === selected.added_by?.id || isAdmin)
    : false;

  const handleEditSave = async () => {
    if (!selected) return;
    if (editCurrentScu !== '' && Number(editCurrentScu) < 0) {
      setEditError('Current SCU cannot be negative.');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      const updated = await resourceInventoryService.update(selected.id, {
        quality:     editQuality !== '' ? Number(editQuality) : undefined,
        current_scu: editCurrentScu !== '' ? Number(editCurrentScu) : undefined,
        location:    editLocation.trim() || undefined,
      });
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelected(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) return <Text c="najaGold">Loading inventory...</Text>;

  return (
    <Stack gap="lg">
      {error && <Text c="red">{error}</Text>}

      <Group justify="flex-end">
        <Button
          variant="outline"
          color="najaGold"
          leftSection={<IconPlus size={16} />}
          onClick={openAdd}
        >
          Add Resource
        </Button>
      </Group>

      {entries.length === 0 ? (
        <Text c="najaTeal">No inventory entries yet.</Text>
      ) : (
        <Table striped highlightOnHover styles={tableStyles}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Resource</Table.Th>
              <Table.Th>Quality</Table.Th>
              <Table.Th>SCU (current / original)</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Held By</Table.Th>
              <Table.Th>Added By</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map(e => {
              const depleted = Number(e.current_scu) <= 0;
              return (
                <Table.Tr
                  key={e.id}
                  onClick={() => handleRowClick(e)}
                  style={{ cursor: 'pointer', opacity: depleted ? 0.45 : 1 }}
                >
                  <Table.Td>{e.ore_name}</Table.Td>
                  <Table.Td>
                    {e.quality != null
                      ? <Text size="sm">{e.quality}</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={depleted ? 'dimmed' : 'najaText'}>
                      {Number(e.current_scu).toFixed(3)} / {Number(e.original_scu).toFixed(3)}
                      {depleted && <Text span size="xs" c="dimmed"> (depleted)</Text>}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {e.location
                      ? <Text size="sm">{e.location}</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">{userName(e.held_by)}</Text></Table.Td>
                  <Table.Td><Text size="sm">{userName(e.added_by)}</Text></Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      <Modal
        opened={addOpen}
        onClose={closeAdd}
        title="Add Resource"
        size="md"
        styles={modalStyles}
      >
        <Stack gap="sm">
          <Autocomplete
            label="Resource"
            placeholder="Start typing..."
            data={oreNames}
            value={addOreName}
            onChange={setAddOreName}
            styles={inputStyles}
          />
          <NumberInput
            label="Quality"
            placeholder="Enter quality"
            allowDecimal={false}
            min={0}
            value={addQuality}
            onChange={setAddQuality}
            styles={inputStyles}
            required
          />
          <NumberInput
            label="SCU"
            placeholder="0.000"
            decimalScale={3}
            min={0.001}
            value={addScu}
            onChange={setAddScu}
            styles={inputStyles}
          />
          <TextInput
            label="Location"
            placeholder="Enter location"
            value={addLocation}
            onChange={e => setAddLocation(e.currentTarget.value)}
            styles={inputStyles}
            required
          />
          {addError && <Text size="sm" c="red">{addError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeAdd} disabled={addSubmitting}>Cancel</Button>
            <Button onClick={handleAdd} loading={addSubmitting}>Add</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Detail / Edit Modal ────────────────────────────────────────────── */}
      <Modal
        opened={detailOpen}
        onClose={() => { closeDetail(); setEditing(false); }}
        title={selected?.ore_name ?? 'Resource Detail'}
        size="md"
        styles={modalStyles}
      >
        {selected && (
          <Stack gap="md">
            <Group gap="xl">
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Original SCU</Text>
                <Text size="sm">{Number(selected.original_scu).toFixed(3)}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Current SCU</Text>
                {editing
                  ? <NumberInput
                      size="xs"
                      decimalScale={3}
                      min={0}
                      value={editCurrentScu}
                      onChange={setEditCurrentScu}
                      styles={inputStyles}
                    />
                  : <Text size="sm" c={Number(selected.current_scu) <= 0 ? 'dimmed' : 'najaText'}>
                      {Number(selected.current_scu).toFixed(3)}
                      {Number(selected.current_scu) <= 0 && ' (depleted)'}
                    </Text>
                }
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Quality</Text>
                {editing
                  ? <NumberInput
                      size="xs"
                      allowDecimal={false}
                      min={0}
                      placeholder="—"
                      value={editQuality}
                      onChange={setEditQuality}
                      styles={inputStyles}
                    />
                  : <Text size="sm">{selected.quality ?? '—'}</Text>
                }
              </Stack>
            </Group>

            <Stack gap={2}>
              <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Location</Text>
              {editing
                ? <TextInput
                    size="xs"
                    placeholder="—"
                    value={editLocation}
                    onChange={e => setEditLocation(e.currentTarget.value)}
                    styles={inputStyles}
                  />
                : <Text size="sm">{selected.location ?? '—'}</Text>
              }
            </Stack>

            <Group gap="xl">
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Held By</Text>
                <Text size="sm">{userName(selected.held_by)}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Added By</Text>
                <Text size="sm">{userName(selected.added_by)}</Text>
              </Stack>
            </Group>

            {editError && <Text size="sm" c="red">{editError}</Text>}

            {canEdit && (
              <Group justify="flex-end" mt="xs">
                {editing ? (
                  <>
                    <Button variant="subtle" color="gray" onClick={() => setEditing(false)} disabled={editSubmitting}>Cancel</Button>
                    <Button onClick={handleEditSave} loading={editSubmitting}>Save</Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)}>Edit</Button>
                )}
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default ResourceInventoryTable;
