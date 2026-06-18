import { useState, useEffect } from 'react';
import {
  Stack, Group, Text, Table, Button, Modal,
  TextInput, NumberInput, Select, Badge, Divider, Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconArrowsExchange, IconFlame } from '@tabler/icons-react';
import { tableStyles, modalStyles, inputStyles } from '../../styles/mantine';
import { useAuth } from '../../hooks';
import { miscInventoryService } from '../../services/inventory/miscInventoryService';
import type {
  MiscInventoryEntry,
  MiscInventoryEvent,
  InventoryCatalogItem,
  InventoryUser,
} from '../../types/inventory';

const userName = (u: MiscInventoryEntry['held_by']) =>
  u ? (u.server_nickname ?? u.global_name ?? u.discord_username) : '—';

const eventLabel = (e: MiscInventoryEvent) => {
  const who = (u: InventoryUser | null) =>
    u ? (u.server_nickname ?? u.global_name ?? u.discord_username) : 'Unknown';
  const date = new Date(e.created_at).toLocaleDateString();
  switch (e.event_type) {
    case 'added':
      return `[${date}] Added ×${e.quantity} → ${who(e.to_user)}`;
    case 'transferred':
      return `[${date}] Transferred ×${e.quantity}: ${who(e.from_user)} → ${who(e.to_user)}`;
    case 'consumed':
      return `[${date}] Consumed ×${e.quantity} by ${who(e.performed_by)}`;
  }
};

interface MiscInventoryTableProps {
  catalogItemId?: number;
}

const MiscInventoryTable = ({ catalogItemId }: MiscInventoryTableProps) => {
  const { user } = useAuth();
  const canManageInventory = user?.permissions?.includes('inventory') ?? false;

  const [holdings,  setHoldings]  = useState<MiscInventoryEntry[]>([]);
  const [catalog,   setCatalog]   = useState<InventoryCatalogItem[]>([]);
  const [members,   setMembers]   = useState<InventoryUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Add modal
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [addCatalogId, setAddCatalogId] = useState<string | null>(
    catalogItemId ? String(catalogItemId) : null
  );
  const [addLocation,  setAddLocation]  = useState('');
  const [addQty,       setAddQty]       = useState<number | string>(1);
  const [addHeldBy,    setAddHeldBy]    = useState<string | null>(null);
  const [addAddedBy,   setAddAddedBy]   = useState<string | null>(null);
  const [addSubmitting,setAddSubmitting]= useState(false);
  const [addError,     setAddError]     = useState('');

  // Detail modal
  const [detailOpen, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [selected,   setSelected]   = useState<MiscInventoryEntry | null>(null);
  const [events,     setEvents]     = useState<MiscInventoryEvent[]>([]);
  const [evLoading,  setEvLoading]  = useState(false);

  // Transfer modal
  const [transferOpen, { open: openTransfer, close: closeTransfer }] = useDisclosure(false);
  const [txToUser, setTxToUser] = useState<string | null>(null);
  const [txQty,    setTxQty]    = useState<number | string>(1);
  const [txSubmit, setTxSubmit] = useState(false);
  const [txError,  setTxError]  = useState('');

  // Consume modal
  const [consumeOpen, { open: openConsume, close: closeConsume }] = useDisclosure(false);
  const [conQty,    setConQty]    = useState<number | string>(1);
  const [conSubmit, setConSubmit] = useState(false);
  const [conError,  setConError]  = useState('');

  useEffect(() => {
    Promise.all([
      miscInventoryService.getHoldings(),
      miscInventoryService.getCatalog(),
      miscInventoryService.getMembers(),
    ])
      .then(([h, cat, mems]) => { setHoldings(h); setCatalog(cat); setMembers(mems); })
      .catch(() => setError('Failed to load misc inventory.'))
      .finally(() => setLoading(false));
  }, []);

  const catalogOptions = catalog.map(c => ({
    value: String(c.id),
    label: c.category ? `${c.display_name} (${c.category.name})` : c.display_name,
  }));

  const memberOptions = members.map(m => ({
    value: String(m.id),
    label: m.server_nickname ?? m.global_name ?? m.discord_username,
  }));

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!addCatalogId)             { setAddError('Please select an item.'); return; }
    if (Number(addQty) < 1)        { setAddError('Quantity must be at least 1.'); return; }
    setAddSubmitting(true); setAddError('');
    try {
      const entry = await miscInventoryService.addHolding({
        catalog_item_id: Number(addCatalogId),
        location:        addLocation.trim() || undefined,
        quantity:        Number(addQty),
        held_by:         addHeldBy  ? Number(addHeldBy)  : undefined,
        added_by:        addAddedBy ? Number(addAddedBy) : undefined,
      });
      setHoldings(prev => [entry, ...prev]);
      closeAdd();
      setAddCatalogId(catalogItemId ? String(catalogItemId) : null); setAddLocation(''); setAddQty(1);
      setAddHeldBy(null); setAddAddedBy(null);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add holding.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Detail ─────────────────────────────────────────────────────────────────

  const handleRowClick = async (entry: MiscInventoryEntry) => {
    setSelected(entry);
    setEvents([]);
    setEvLoading(true);
    openDetail();
    try {
      const evs = await miscInventoryService.getEvents(entry.id);
      setEvents(evs);
    } finally {
      setEvLoading(false);
    }
  };

  const canActOnHolding = (h: MiscInventoryEntry) =>
    user?.id === h.held_by?.id || canManageInventory;

  // ── Transfer ───────────────────────────────────────────────────────────────

  const openTransferFor = (h: MiscInventoryEntry) => {
    setSelected(h);
    setTxToUser(null); setTxQty(1); setTxError('');
    openTransfer();
  };

  const handleTransfer = async () => {
    if (!selected) return;
    if (!txToUser)          { setTxError('Please select a recipient.'); return; }
    if (Number(txQty) < 1)  { setTxError('Quantity must be at least 1.'); return; }
    setTxSubmit(true); setTxError('');
    try {
      const updated = await miscInventoryService.transfer(selected.id, {
        to_user_id: Number(txToUser),
        quantity:   Number(txQty),
      });
      setHoldings(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelected(updated);
      closeTransfer();
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Transfer failed.');
    } finally {
      setTxSubmit(false);
    }
  };

  // ── Consume ────────────────────────────────────────────────────────────────

  const openConsumeFor = (h: MiscInventoryEntry) => {
    setSelected(h);
    setConQty(1); setConError('');
    openConsume();
  };

  const handleConsume = async () => {
    if (!selected) return;
    if (Number(conQty) < 1) { setConError('Quantity must be at least 1.'); return; }
    setConSubmit(true); setConError('');
    try {
      const updated = await miscInventoryService.consume(selected.id, {
        quantity: Number(conQty),
      });
      setHoldings(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelected(updated);
      closeConsume();
    } catch (err) {
      setConError(err instanceof Error ? err.message : 'Consume failed.');
    } finally {
      setConSubmit(false);
    }
  };

  const displayedHoldings = catalogItemId
    ? holdings.filter(h => h.catalog_item_id === catalogItemId)
    : holdings;

  if (loading) return <Text c="najaGold">Loading misc inventory...</Text>;

  return (
    <Stack gap="lg">
      {error && <Text c="red">{error}</Text>}

      <Group justify="flex-end">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openAdd}
          disabled={catalog.length === 0}
        >
          Report Holding
        </Button>
      </Group>

      {catalog.length === 0 && (
        <Text c="najaTeal">No tracked items defined yet. An admin must add items before holdings can be reported.</Text>
      )}

      {catalog.length > 0 && displayedHoldings.length === 0 && (
        <Text c="najaTeal">No holdings reported yet.</Text>
      )}

      {displayedHoldings.length > 0 && (
        <Table striped highlightOnHover styles={tableStyles}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Held By</Table.Th>
              <Table.Th>Added By</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {displayedHoldings.map(h => {
              const depleted = h.status === 'depleted';
              return (
                <Table.Tr
                  key={h.id}
                  onClick={() => handleRowClick(h)}
                  style={{ cursor: 'pointer', opacity: depleted ? 0.45 : 1 }}
                >
                  <Table.Td><Text size="sm">{h.display_name}</Text></Table.Td>
                  <Table.Td>
                    {h.category
                      ? <Badge variant="outline" color="najaGold" size="sm">{h.category.name}</Badge>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">{h.quantity}</Text></Table.Td>
                  <Table.Td>
                    {h.location
                      ? <Text size="sm">{h.location}</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">{userName(h.held_by)}</Text></Table.Td>
                  <Table.Td><Text size="sm">{userName(h.added_by)}</Text></Table.Td>
                  <Table.Td>
                    {canActOnHolding(h) && !depleted && (
                      <Group gap={4} onClick={ev => ev.stopPropagation()}>
                        <Button
                          size="compact-xs" variant="subtle" color="najaGold"
                          leftSection={<IconArrowsExchange size={12} />}
                          onClick={() => openTransferFor(h)}
                        >
                          Transfer
                        </Button>
                        <Button
                          size="compact-xs" variant="subtle" color="red"
                          leftSection={<IconFlame size={12} />}
                          onClick={() => openConsumeFor(h)}
                        >
                          Consume
                        </Button>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────────── */}
      <Modal opened={addOpen} onClose={closeAdd} title="Report Holding" size="md" styles={modalStyles}>
        <Stack gap="sm">
          {!catalogItemId && (
            <Select
              label="Item"
              placeholder="Select an item..."
              data={catalogOptions}
              value={addCatalogId}
              onChange={setAddCatalogId}
              searchable
              styles={inputStyles}
              required
            />
          )}
          <NumberInput
            label="Quantity"
            min={1}
            allowDecimal={false}
            value={addQty}
            onChange={setAddQty}
            styles={inputStyles}
            required
          />
          <TextInput
            label="Location"
            placeholder="Where is it stored?"
            value={addLocation}
            onChange={e => setAddLocation(e.currentTarget.value)}
            styles={inputStyles}
          />
          <Select
            label="Held By"
            placeholder="Defaults to you"
            data={memberOptions}
            value={addHeldBy}
            onChange={setAddHeldBy}
            searchable
            clearable
            styles={inputStyles}
          />
          <Select
            label="Added By"
            placeholder="Defaults to you"
            data={memberOptions}
            value={addAddedBy}
            onChange={setAddAddedBy}
            searchable
            clearable
            styles={inputStyles}
          />
          {addError && <Text size="sm" c="red">{addError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeAdd} disabled={addSubmitting}>Cancel</Button>
            <Button onClick={handleAdd} loading={addSubmitting}>Submit</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Detail Modal ───────────────────────────────────────────────────────── */}
      <Modal
        opened={detailOpen}
        onClose={closeDetail}
        title={selected?.display_name ?? 'Holding Detail'}
        size="lg"
        styles={modalStyles}
      >
        {selected && (
          <Stack gap="md">
            <Group gap="xl" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Category</Text>
                <Text size="sm">{selected.category?.name ?? '—'}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Quantity</Text>
                <Text size="sm">{selected.quantity}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Location</Text>
                <Text size="sm">{selected.location ?? '—'}</Text>
              </Stack>
            </Group>
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

            <Divider color="rgba(204,172,49,0.2)" />

            <Text size="xs" c="najaTeal" tt="uppercase" fw={700}>Chain of Custody</Text>
            {evLoading ? (
              <Loader size="xs" color="najaGold" />
            ) : events.length === 0 ? (
              <Text size="sm" c="dimmed">No events recorded.</Text>
            ) : (
              <Stack gap={4}>
                {events.map(ev => (
                  <Stack key={ev.id} gap={2}>
                    <Text size="sm">{eventLabel(ev)}</Text>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Modal>

      {/* ── Transfer Modal ─────────────────────────────────────────────────────── */}
      <Modal
        opened={transferOpen}
        onClose={closeTransfer}
        title={`Transfer: ${selected?.display_name ?? ''}`}
        size="sm"
        styles={modalStyles}
      >
        <Stack gap="sm">
          <Select
            label="Transfer To"
            placeholder="Select member..."
            data={memberOptions}
            value={txToUser}
            onChange={setTxToUser}
            searchable
            styles={inputStyles}
            required
          />
          <NumberInput
            label="Quantity"
            min={1}
            max={selected?.quantity ?? 1}
            allowDecimal={false}
            value={txQty}
            onChange={setTxQty}
            styles={inputStyles}
            description={selected ? `Available: ${selected.quantity}` : undefined}
          />
          {txError && <Text size="sm" c="red">{txError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeTransfer} disabled={txSubmit}>Cancel</Button>
            <Button onClick={handleTransfer} loading={txSubmit}>Transfer</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Consume Modal ──────────────────────────────────────────────────────── */}
      <Modal
        opened={consumeOpen}
        onClose={closeConsume}
        title={`Consume: ${selected?.display_name ?? ''}`}
        size="sm"
        styles={modalStyles}
      >
        <Stack gap="sm">
          <NumberInput
            label="Quantity to Consume"
            min={1}
            max={selected?.quantity ?? 1}
            allowDecimal={false}
            value={conQty}
            onChange={setConQty}
            styles={inputStyles}
            description={selected ? `Available: ${selected.quantity}` : undefined}
          />
          {conError && <Text size="sm" c="red">{conError}</Text>}
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={closeConsume} disabled={conSubmit}>Cancel</Button>
            <Button variant="outline" color="red" onClick={handleConsume} loading={conSubmit}>Consume</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default MiscInventoryTable;
