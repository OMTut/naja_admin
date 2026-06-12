"""add misc_inventory tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'misc_categories',
        sa.Column('id',         sa.Integer(),              primary_key=True, autoincrement=True),
        sa.Column('name',       sa.String(100),            nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )

    op.create_table(
        'misc_inventory',
        sa.Column('id',           sa.Integer(),              primary_key=True, autoincrement=True),
        sa.Column('display_name', sa.String(255),            nullable=False),
        sa.Column('category_id',  sa.Integer(),              sa.ForeignKey('misc_categories.id', ondelete='SET NULL'), nullable=True),
        sa.Column('location',     sa.String(255),            nullable=True),
        sa.Column('quantity',     sa.Integer(),              nullable=False, server_default='1'),
        sa.Column('status',       sa.String(20),             nullable=False, server_default='active'),
        sa.Column('held_by',      sa.Integer(),              sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('added_by',     sa.Integer(),              sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at',   sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
        sa.Column('updated_at',   sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )
    op.create_index('ix_misc_inventory_added_by', 'misc_inventory', ['added_by'])
    op.create_index('ix_misc_inventory_held_by',  'misc_inventory', ['held_by'])

    op.create_table(
        'misc_inventory_events',
        sa.Column('id',              sa.Integer(),              primary_key=True, autoincrement=True),
        sa.Column('item_id',         sa.Integer(),              sa.ForeignKey('misc_inventory.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type',      sa.String(20),             nullable=False),
        sa.Column('quantity',        sa.Integer(),              nullable=False),
        sa.Column('from_user_id',    sa.Integer(),              sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('to_user_id',      sa.Integer(),              sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('performed_by_id', sa.Integer(),              sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('notes',           sa.String(500),            nullable=True),
        sa.Column('created_at',      sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )
    op.create_index('ix_misc_inventory_events_item_id', 'misc_inventory_events', ['item_id'])


def downgrade() -> None:
    op.drop_table('misc_inventory_events')
    op.drop_table('misc_inventory')
    op.drop_table('misc_categories')
