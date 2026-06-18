# Roles & Sync

This document covers the two types of roles in Naja Admin, how they are created and managed, and how they stay in sync with Discord via the Gibbs bot.

---

## Role Types

### Discord Roles

Discord roles are manually created in the app and in the Discord server. They are registered in Naja Admin by entering their Discord Role ID. The `role_discord_id` field must match the actual ID of the role in the guild.

**Characteristics:**
- Tied to a real Discord role by `role_discord_id`
- User assignments are synced from Discord automatically (see [Sync Behavior](#sync-behavior))
- Gibbs can assign and remove these roles directly on Discord members

**How to register a Discord role:**
1. In Discord, go to Server Settings → Roles and copy the role's ID
2. In Naja Admin → Role Management, click **Create Role**
3. Paste the Discord Role ID into the **Discord Role ID** field
4. Fill in the name, description, and whether it grants access

---

### App Roles

App roles exist only in Naja Admin. They are used to assign internal permissions or groupings that have no equivalent in Discord.

**Characteristics:**
- The `role_discord_id` field is still required by the form but the value does not correspond to any real Discord role
- Gibbs will not find these IDs in the guild and will skip them during Discord operations
- Naja Admin handles them independently and preserves them during Discord syncs
- They are **not overwritten** when Discord role syncs occur

**How to create an app role:**
1. In Naja Admin → Role Management, click **Create Role**
2. Enter a placeholder value in **Discord Role ID** (e.g. `app-blueprint-master`) — it will not be used by Discord
3. Leave **Grants Access** unchecked unless this role should grant login access

---

## Sync Behavior

User role assignments (the `users_roles` table) can be updated by three different events:

### 1. User Login (Discord OAuth)

When a user logs in, Naja Admin fetches their current roles from Discord and runs a full sync:

- Naja Admin fetches all assignable role IDs from the guild via Gibbs
- The user's current app-only roles are identified and set aside
- Discord-managed role assignments are cleared and re-added from Discord
- App-only roles are restored

> **Note:** If Gibbs is unavailable at login time, the fallback is a full clear-and-replace with no app role preservation. App roles will be restored on the next successful login once Gibbs is reachable.

---

### 2. Discord Role Change → Naja Admin (Gibbs `on_member_update`)

When a member's roles change in The Junto Discord server, Gibbs detects the change via the `on_member_update` event and immediately notifies Naja Admin.

**Flow:**
```
Discord role change
  → Gibbs on_member_update fires
  → Gibbs POSTs to POST /api/bot/sync-roles
  → Naja Admin identifies which of the user's current roles are app-only
  → Clears Discord-managed roles, re-adds from Discord sync
  → Restores app-only roles
```

**What is preserved:** App roles (those whose `role_discord_id` is not in the guild's role list) are identified before clearing and restored afterwards.

**Requires:** Gibbs must be running and the **Server Members Intent** must be enabled in the Discord Developer Portal for Gibbs's application.

---

### 3. Admin Edit in Naja Admin → Discord (DB → Discord)

When an admin edits a user's roles in Naja Admin (User Management → Actions → Edit Roles), the change is pushed to Discord via Gibbs before being written to the database.

**Flow:**
```
Admin saves role changes in UI
  → Naja Admin calls PUT /api/members/{discord_id}/roles on Gibbs
  → Gibbs adds/removes Discord roles one at a time on the member
  → Roles not found in the guild (app roles) are returned as not_in_discord_ids
  → Naja Admin writes confirmed Discord roles + app roles to DB
  → UI updates; any permission errors are shown in the modal
```

**If Gibbs is unavailable:** If `GIBBS_API_URL` is not set, the DB write proceeds without a Discord sync.

**If a role fails:** Roles that succeed are saved (both in Discord and the DB). Roles that fail (e.g. Gibbs lacks permission to assign them) are skipped in both Discord and the DB, and the error is displayed in the Edit Roles modal.

---

## Gibbs Bot Integration

Gibbs runs as a separate service (`discord-bots/discord-role-bot`) alongside the Naja Admin API.

| Service | Port | Purpose |
|---------|------|---------|
| Naja Admin API | 8000 | Admin panel backend |
| Gibbs API | 8001 | Discord role operations |

### Authentication

All communication between Naja Admin and Gibbs is authenticated with a shared `BOT_API_KEY` environment variable. Requests without a valid key are rejected with `401 Unauthorized`.

Both services must have the same value set in their respective `.env` files:
```
BOT_API_KEY=<shared secret>
```

### Environment Variables

**Gibbs `.env`:**
```
DISCORD_TOKEN=<bot token>
BOT_API_KEY=<shared secret>
NAJA_ADMIN_URL=http://localhost:8000
DEV_GUILD_ID=<guild id>
PROD_GUILD_ID=<guild id>
ENVIRONMENT=development
```

**Naja Admin `.env`:**
```
BOT_API_KEY=<shared secret>
GIBBS_API_URL=http://localhost:8001
```

### Bot Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | Required | Bot health check |
| `GET` | `/api/roles` | Required | All assignable roles in the guild |
| `PUT` | `/api/members/{discord_user_id}/roles` | Required | Set a member's Discord roles |

### Naja Admin Bot Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/bot/sync-roles` | Required | Called by Gibbs to sync a member's roles into the DB |

---

## Role Deletion

When a role is deleted from Naja Admin:

1. `remove_role_from_all_users(role_id)` is called first, removing all assignments from `users_roles`
2. The role record is then deleted from the `roles` table

This prevents orphaned rows in `users_roles` regardless of the database foreign key constraint setting.

---

## Summary Table

| Event | Discord Updated | DB Updated | App Roles Preserved |
|-------|----------------|-----------|---------------------|
| User login | No | Yes | Yes (requires Gibbs) |
| Discord role change (Gibbs) | — | Yes | Yes |
| Admin edit in Naja Admin | Yes | Yes (what succeeded) | Yes |
