"""rename grants_access to grants_admin_access on roles table

Revision ID: k1f2g3h4i5j6
Revises: j0e1f2g3h4i5
Create Date: 2026-06-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'k1f2g3h4i5j6'
down_revision: Union[str, None] = 'j0e1f2g3h4i5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('roles', 'grants_access', new_column_name='grants_admin_access')


def downgrade() -> None:
    op.alter_column('roles', 'grants_admin_access', new_column_name='grants_access')
