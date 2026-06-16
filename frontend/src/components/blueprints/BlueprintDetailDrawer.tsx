import { Drawer, Stack, Group, Text, Loader, List, Button } from '@mantine/core';
import { drawerClassNames } from '../../styles/mantine';
import type { BlueprintDetail } from '../../types/blueprint';

const displayName = (u: { server_nickname: string | null; global_name: string | null; discord_username: string }) =>
  u.server_nickname ?? u.global_name ?? u.discord_username;

interface BlueprintDetailDrawerProps {
  opened: boolean;
  onClose: () => void;
  blueprint: BlueprintDetail | null;
  loading: boolean;
  error: string;
  onRemove?: (uuid: string) => void;
}

const BlueprintDetailDrawer = ({ opened, onClose, blueprint, loading, error, onRemove }: BlueprintDetailDrawerProps) => (
  <Drawer
    opened={opened}
    onClose={onClose}
    title={blueprint?.output_name ?? 'Blueprint Detail'}
    position="right"
    size="lg"
    classNames={drawerClassNames}
  >
    {loading && <Group justify="center" p="md"><Loader color="najaGold" size="sm" /></Group>}
    {error && <span className="naja-drawer-error">{error}</span>}
    {blueprint && !loading && (
      <Stack gap="lg" pt="lg">
        <Group gap="md" grow>
          {blueprint.category_label && (
            <Stack gap={2}>
              <span className="naja-detail-label">Category</span>
              <span className="naja-detail-value">{blueprint.category_label}</span>
            </Stack>
          )}
          {blueprint.craft_time_label && (
            <Stack gap={2}>
              <span className="naja-detail-label">Craft Time</span>
              <span className="naja-detail-value">{blueprint.craft_time_label}</span>
            </Stack>
          )}
          {blueprint.ingredient_count != null && (
            <Stack gap={2}>
              <span className="naja-detail-label">Ingredients</span>
              <span className="naja-detail-value">{blueprint.ingredient_count}</span>
            </Stack>
          )}
        </Group>

        <Stack gap={4}>
          <span className="naja-detail-label">
            Org Owners ({blueprint.owners.length})
          </span>
          {blueprint.owners.length === 0 ? (
            <span className="naja-detail-empty">None</span>
          ) : (
            <span className="naja-detail-value">
              {blueprint.owners.map(displayName).join(', ')}
            </span>
          )}
        </Stack>

        {blueprint.ingredients && blueprint.ingredients.length > 0 && (
          <Stack gap={4}>
            <span className="naja-detail-label">Ingredients</span>
            <List size="sm" spacing={2}>
              {blueprint.ingredients.map((ing, i) => (
                <List.Item key={i} className="naja-detail-ingredient-list">
                  {ing.name}
                  {ing.quantity_scu != null && ` — ${ing.quantity_scu} SCU`}
                  {ing.quantity != null && ing.quantity_scu == null && ` × ${ing.quantity}`}
                </List.Item>
              ))}
            </List>
          </Stack>
        )}

        {blueprint.ingredients === null && (
          <span className="naja-status-offline">Ingredient data unavailable (SC_Data offline).</span>
        )}

        {onRemove && (
          <Group justify="flex-end" mt="xs">
            <Button variant="filled" className="naja-remove-btn" onClick={() => { onRemove(blueprint.uuid); onClose(); }}>
              Remove
            </Button>
          </Group>
        )}
      </Stack>
    )}
  </Drawer>
);

export default BlueprintDetailDrawer;
