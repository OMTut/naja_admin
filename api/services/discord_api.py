import os
import httpx
import logging

logger = logging.getLogger(__name__)


async def get_all_guild_role_ids() -> list[str]:
    """Fetch all assignable role IDs from the guild via Gibbs."""
    gibbs_url = os.getenv("GIBBS_API_URL")
    api_key = os.getenv("BOT_API_KEY")
    if not gibbs_url or not api_key:
        return []
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{gibbs_url}/api/roles",
                headers={"X-API-Key": api_key},
                timeout=5.0,
            )
        if response.is_success:
            return [str(r["id"]) for r in response.json()]
    except Exception as e:
        logger.warning(f"Failed to fetch guild roles from Gibbs: {e}")
    return []

async def get_member_profile(discord_id: str) -> dict | None:
    """
    Fetch a guild member's username and server nickname via the bot token.
    Returns {'username': str, 'server_nickname': str | None} or None on failure.
    Email is not available via bot token — it is only refreshed on OAuth login.
    """
    bot_token = os.getenv("DISCORD_BOT_TOKEN")
    guild_id = os.getenv("TARGET_SERVER_ID")
    if not bot_token or not guild_id:
        return None
    try:
        url = f"https://discord.com/api/v10/guilds/{guild_id}/members/{discord_id}"
        headers = {"Authorization": f"Bot {bot_token}"}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("user", {})
            return {
                "username": user_data.get("username"),
                "global_name": user_data.get("global_name"),
                "server_nickname": data.get("nick"),
            }
    except Exception as e:
        logger.warning(f"Failed to fetch member profile for {discord_id}: {e}")
    return None


async def get_user_roles_from_discord_api(user_discord_id: str) -> list[str]:
    """
    Definition: get_user_roles_from_discord_api
    Params: user_discord_id: str
    Return: a list of Discord role ids from the Discord api
    Given a user_discord_id from the database, gets the roles from Discord
    """
    bot_token = os.getenv("DISCORD_BOT_TOKEN")
    guild_id = os.getenv("TARGET_SERVER_ID")

    if not bot_token:
        logger.error("DISCORD_BOT_TOKEN not found")
        return []
    if not guild_id:
        logger.error("TARGET_SERVER_ID not found")
        return []
    
    try:
        url = f"https://discord.com/api/v10/guilds/{guild_id}/members/{user_discord_id}"
        headers = {
            "Authorization": f"Bot {bot_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)

            if response.status_code == 200:
                member_data = response.json()
                roles = member_data.get("roles", [])
                logger.info(f"Retrieved {len(roles)} roles for user {user_discord_id}")
                return roles
            elif response.status_code == 404:
                logger.warning(f"User {user_discord_id} not found in server {guild_id}")
                return []
            else:
                logger.error(f"Discord API error: {response.status_code} - {response.text}")
                return []
    except Exception as e:
        logger.error(f"Error getting Discord roles for {user_discord_id}: {e}")
        return []
