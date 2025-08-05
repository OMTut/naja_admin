"""create users_permissions table

Revision ID: 7fd02218a27e
Revises: abaea4a4295c
Create Date: 2025-08-05 09:53:37.995371

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fd02218a27e'
down_revision: Union[str, None] = 'abaea4a4295c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users_permissions',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.permission_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'permission_id')
        )


def downgrade() -> None:
    op.drop_table('users_permissions')
