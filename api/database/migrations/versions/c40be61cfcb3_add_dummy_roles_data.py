"""Add dummy roles data

Revision ID: c40be61cfcb3
Revises: e17d586145f4
Create Date: 2025-08-01 11:25:41.004504

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c40be61cfcb3'
down_revision: Union[str, None] = 'e17d586145f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add dummy roles data
    op.execute("""
        INSERT INTO roles (
            role_discord_id, role_name, role_description,created_at, updated_at
        ) 
        VALUES 
            ('123456789012345678', 'Admin', 'Administrator role with full permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('234567890123456789', 'User', 'Moderator role with limited permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('345678901234567890', 'Guest', 'Standard user role with basic permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """)

def downgrade() -> None:
    # Remove dummy roles data
    op.execute("DELETE FROM roles WHERE role_name IN ('Admin', 'User', 'Guest')")
