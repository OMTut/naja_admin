# Login and Access

There's a Discord bot (Gibbs) that sits between Naja Admin and Discord. It's job is to keep roles in sync in both directions.

Login happens with Discord OAuth. Access happens a check between local session and db
permissions.

## Login - Flow
- User hits Discord OAuth for login
- Naja fetches the user's guild memberhip and roles from Discord
- rejects login if not a member of the server or does not have the correct app role.
- new accounts are set to pending and need admin approval.

## Access check
Access checks happen in the db
- Is the user in the guild? - Discord API
- Is the user approved? - Naja db
- Do their discord roles grant access?
