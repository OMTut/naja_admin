"""add resource_inventory table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'resource_inventory',
        sa.Column('id',           sa.Integer(),      primary_key=True, autoincrement=True),
        sa.Column('ore_name',     sa.String(255),    nullable=False),
        sa.Column('quality',      sa.Integer(),      nullable=True),
        sa.Column('original_scu', sa.Numeric(10, 3), nullable=False),
        sa.Column('current_scu',  sa.Numeric(10, 3), nullable=False),
        sa.Column('location',     sa.String(255),    nullable=True),
        sa.Column('held_by',      sa.Integer(),      sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('added_by',     sa.Integer(),      sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at',   sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
        sa.Column('updated_at',   sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )


def downgrade() -> None:
    op.drop_table('resource_inventory')
