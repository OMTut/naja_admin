"""rename grants_admin_access to grants_site_access on roles table

Revision ID: l2g3h4i5j6k1
Revises: k1f2g3h4i5j6
Create Date: 2026-06-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'l2g3h4i5j6k1'
down_revision: Union[str, None] = 'k1f2g3h4i5j6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('roles', 'grants_admin_access', new_column_name='grants_site_access')


def downgrade() -> None:
    op.alter_column('roles', 'grants_site_access', new_column_name='grants_admin_access')
