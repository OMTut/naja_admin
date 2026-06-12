"""add inventory_catalog, refactor inventory_misc

Revision ID: h8c9d0e1f2g3
Revises: g7b8c9d0e1f2
Create Date: 2026-06-11 00:00:00.000000

Converts inventory_misc from storing display_name/category_id directly
to referencing inventory_catalog entries instead.
Existing rows are migrated: a catalog entry is created for each distinct
(display_name, category_id) pair, then inventory_misc rows are linked.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h8c9d0e1f2g3'
down_revision: Union[str, None] = 'g7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create inventory_catalog
    op.create_table(
        'inventory_catalog',
        sa.Column('id',           sa.Integer(),              primary_key=True, autoincrement=True),
        sa.Column('display_name', sa.String(255),            nullable=False),
        sa.Column('category_id',  sa.Integer(),              sa.ForeignKey('inventory_categories.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_by',   sa.Integer(),              sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at',   sa.DateTime(timezone=True), server_default=sa.func.current_timestamp()),
    )

    # 2. Populate catalog from existing misc items (distinct name/category pairs)
    op.execute("""
        INSERT INTO inventory_catalog (display_name, category_id, created_at)
        SELECT display_name, category_id, MIN(created_at)
        FROM inventory_misc
        GROUP BY display_name, category_id
    """)

    # 3. Add catalog_item_id to inventory_misc (nullable during migration)
    op.add_column('inventory_misc', sa.Column('catalog_item_id', sa.Integer(), nullable=True))

    # 4. Link existing rows to their catalog entries
    op.execute("""
        UPDATE inventory_misc mi
        SET catalog_item_id = ic.id
        FROM inventory_catalog ic
        WHERE mi.display_name = ic.display_name
          AND (
                (mi.category_id IS NULL AND ic.category_id IS NULL)
             OR mi.category_id = ic.category_id
          )
    """)

    # 5. Apply FK constraint and make NOT NULL
    op.create_foreign_key(
        'fk_inventory_misc_catalog_item',
        'inventory_misc', 'inventory_catalog',
        ['catalog_item_id'], ['id'],
        ondelete='RESTRICT',
    )
    op.alter_column('inventory_misc', 'catalog_item_id', nullable=False)

    # 6. Drop old columns that are now on the catalog
    op.drop_column('inventory_misc', 'display_name')
    op.drop_column('inventory_misc', 'category_id')


def downgrade() -> None:
    # Re-add columns
    op.add_column('inventory_misc', sa.Column('display_name', sa.String(255), nullable=True))
    op.add_column('inventory_misc', sa.Column('category_id',  sa.Integer(),   nullable=True))

    # Restore values from catalog
    op.execute("""
        UPDATE inventory_misc mi
        SET display_name = ic.display_name,
            category_id  = ic.category_id
        FROM inventory_catalog ic
        WHERE mi.catalog_item_id = ic.id
    """)

    op.alter_column('inventory_misc', 'display_name', nullable=False)

    # Drop the catalog FK and column
    op.drop_constraint('fk_inventory_misc_catalog_item', 'inventory_misc', type_='foreignkey')
    op.drop_column('inventory_misc', 'catalog_item_id')

    op.drop_table('inventory_catalog')
