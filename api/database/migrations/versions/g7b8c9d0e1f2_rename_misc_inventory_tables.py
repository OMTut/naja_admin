"""rename misc inventory tables

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'g7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table('misc_categories',      'inventory_categories')
    op.rename_table('misc_inventory',       'inventory_misc')
    op.rename_table('misc_inventory_events','inventory_misc_events')


def downgrade() -> None:
    op.rename_table('inventory_misc_events','misc_inventory_events')
    op.rename_table('inventory_misc',       'misc_inventory')
    op.rename_table('inventory_categories', 'misc_categories')
