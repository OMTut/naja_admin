import os
import httpx
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

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
