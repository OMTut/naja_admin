from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, Dict, Any
from ...models.user import User, UserStatus
from ...connection import SessionLocal

def update_user_discord_info(user_id: int, discord_data: Dict[str, Any]) -> bool:
    """Update Discord-related information for a user in the database."""
    try:
        with SessionLocal() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            user.discord_username = discord_data.get('username')
            user.global_name = discord_data.get('global_name')
            user.email = discord_data.get('email')
            user.server_nickname = discord_data.get('server_nickname')

            session.commit()
            return True
    except IntegrityError:
        session.rollback()
        return False