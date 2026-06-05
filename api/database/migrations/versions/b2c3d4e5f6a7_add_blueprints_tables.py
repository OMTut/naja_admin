"""add blueprints tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'item_categories',
        sa.Column('uuid',       sa.String(36),  primary_key=True),
        sa.Column('record_key', sa.String(128), nullable=True),
        sa.Column('label',      sa.String(128), nullable=False),
        sa.Column('sort_order', sa.Integer(),   nullable=True),
    )

    op.create_table(
        'blueprints',
        sa.Column('uuid',               sa.String(36),  primary_key=True),
        sa.Column('key',                sa.String(255), nullable=True),
        sa.Column('category_uuid',      sa.String(36),  sa.ForeignKey('item_categories.uuid'), nullable=True),
        sa.Column('output_item_uuid',   sa.String(36),  nullable=True),
        sa.Column('output_name',        sa.String(255), nullable=True),
        sa.Column('output_class',       sa.String(128), nullable=True),
        sa.Column('craft_time_seconds', sa.Integer(),   nullable=True),
        sa.Column('craft_time_label',   sa.String(32),  nullable=True),
        sa.Column('ingredient_count',   sa.Integer(),   nullable=True),
        sa.Column('synced_at',          sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )

    op.create_table(
        'user_blueprints',
        sa.Column('id',             sa.Integer(),  primary_key=True, autoincrement=True),
        sa.Column('user_id',        sa.Integer(),  sa.ForeignKey('users.id',        ondelete='CASCADE'), nullable=False),
        sa.Column('blueprint_uuid', sa.String(36), sa.ForeignKey('blueprints.uuid', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at',     sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
        sa.UniqueConstraint('user_id', 'blueprint_uuid', name='uq_user_blueprint'),
    )


def downgrade() -> None:
    op.drop_table('user_blueprints')
    op.drop_table('blueprints')
    op.drop_table('item_categories')
