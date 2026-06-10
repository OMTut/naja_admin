"""add ores table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ores',
        sa.Column('id',           sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column('display_name', sa.String(255),  nullable=False),
        sa.Column('type',         sa.String(32),   nullable=True),
        sa.Column('synced_at',    sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )
    op.create_unique_constraint('uq_ores_display_name', 'ores', ['display_name'])


def downgrade() -> None:
    op.drop_constraint('uq_ores_display_name', 'ores', type_='unique')
    op.drop_table('ores')
