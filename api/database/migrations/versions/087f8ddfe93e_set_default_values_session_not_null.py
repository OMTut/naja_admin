"""Set default values session not null

Revision ID: 087f8ddfe93e
Revises: aefdca9d0b9f
Create Date: 2025-08-01 12:10:08.202329

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '087f8ddfe93e'
down_revision: Union[str, None] = 'aefdca9d0b9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Set default values for existing records
    op.execute("UPDATE sessions SET last_accessed_at = created_at WHERE last_accessed_at IS NULL")
    
    # Now make it NOT NULL
    op.alter_column('sessions', 'last_accessed_at', nullable=False)


def downgrade() -> None:
    op.alter_column('sessions', 'last_accessed_at', nullable=True)
