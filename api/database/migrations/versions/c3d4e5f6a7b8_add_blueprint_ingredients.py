"""add blueprint_ingredients table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'blueprint_ingredients',
        sa.Column('id',                 sa.Integer(),   primary_key=True, autoincrement=True),
        sa.Column('blueprint_uuid',     sa.String(36),  sa.ForeignKey('blueprints.uuid', ondelete='CASCADE'), nullable=False),
        sa.Column('name',               sa.String(255), nullable=False),
        sa.Column('kind',               sa.String(32),  nullable=True),
        sa.Column('resource_type_uuid', sa.String(36),  nullable=True),
        sa.Column('item_uuid',          sa.String(36),  nullable=True),
        sa.Column('quantity_scu',       sa.Float(),     nullable=True),
        sa.Column('quantity',           sa.Integer(),   nullable=True),
    )
    op.create_index('ix_blueprint_ingredients_blueprint_uuid', 'blueprint_ingredients', ['blueprint_uuid'])


def downgrade() -> None:
    op.drop_index('ix_blueprint_ingredients_blueprint_uuid', 'blueprint_ingredients')
    op.drop_table('blueprint_ingredients')
