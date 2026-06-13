"""migrate role booleans to permissions system

Seeds permissions table, migrates grants_site_access and grants_inventory data
to the roles_permissions join table, and drops the boolean columns.

Revision ID: m3h4i5j6k1l2
Revises: l2g3h4i5j6k1
Create Date: 2026-06-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'm3h4i5j6k1l2'
down_revision: Union[str, None] = 'l2g3h4i5j6k1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Create roles_permissions if it wasn't created by an earlier migration
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS roles_permissions (
            role_id      INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
            permission_id INTEGER NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
            PRIMARY KEY (role_id, permission_id)
        )
    """))

    # Seed permissions
    conn.execute(sa.text("""
        INSERT INTO permissions (permission_name, permission_description)
        VALUES
            ('site_access',  'Grants access to the site'),
            ('admin',        'Grants access to the admin panel'),
            ('inventory',    'Grants access to inventory management'),
            ('blueprints',   'Grants access to blueprint management')
        ON CONFLICT (permission_name) DO NOTHING
    """))

    # Migrate grants_site_access → roles_permissions
    conn.execute(sa.text("""
        INSERT INTO roles_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.grants_site_access = true
          AND p.permission_name = 'site_access'
        ON CONFLICT DO NOTHING
    """))

    # Migrate grants_inventory → roles_permissions
    conn.execute(sa.text("""
        INSERT INTO roles_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.grants_inventory = true
          AND p.permission_name = 'inventory'
        ON CONFLICT DO NOTHING
    """))

    # Migrate ADMIN_ROLES names → admin permission
    conn.execute(sa.text("""
        INSERT INTO roles_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name IN ('Role 1', 'App Admin')
          AND p.permission_name = 'admin'
        ON CONFLICT DO NOTHING
    """))

    # Drop boolean columns
    op.drop_column('roles', 'grants_site_access')
    op.drop_column('roles', 'grants_inventory')


def downgrade() -> None:
    op.add_column('roles', sa.Column('grants_site_access', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('roles', sa.Column('grants_inventory',   sa.Boolean(), nullable=False, server_default='false'))

    conn = op.get_bind()

    conn.execute(sa.text("""
        UPDATE roles r SET grants_site_access = true
        WHERE EXISTS (
            SELECT 1 FROM roles_permissions rp
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = r.role_id AND p.permission_name = 'site_access'
        )
    """))

    conn.execute(sa.text("""
        UPDATE roles r SET grants_inventory = true
        WHERE EXISTS (
            SELECT 1 FROM roles_permissions rp
            JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE rp.role_id = r.role_id AND p.permission_name = 'inventory'
        )
    """))
