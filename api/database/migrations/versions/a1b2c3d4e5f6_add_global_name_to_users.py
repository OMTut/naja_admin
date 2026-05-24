"""add global_name to users table

Revision ID: a1b2c3d4e5f6
Revises: 087f8ddfe93e
Create Date: 2026-05-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8c83d0a29259'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('global_name', sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'global_name')
