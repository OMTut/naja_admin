"""add grants_access column to roles table

Revision ID: 8c83d0a29259
Revises: c94fafdcd85a
Create Date: 2025-08-13 11:45:42.712001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c83d0a29259'
down_revision: Union[str, None] = 'c94fafdcd85a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    import os
    import json
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Add the grants_access column with a default value
    op.add_column('roles', sa.Column('grants_access', sa.Boolean(), nullable=False, server_default='false'))
    
    # Get roles data from environment variable
    roles_env = os.getenv('ROLES')
    if roles_env:
        try:
            roles_data = json.loads(roles_env)
            
            # Update each role with grants_access value from env data
            for role_key, role_info in roles_data.items():
                discord_id = role_info.get('discord_id', '')
                grants_access = role_info.get('grants_access', False)
                
                # Update the role based on discord_id
                sql = f"""UPDATE roles 
                         SET grants_access = {str(grants_access).lower()} 
                         WHERE role_discord_id = '{discord_id}'"""
                op.execute(sql)
                print(f"Updated role {discord_id}: grants_access = {grants_access}")
                
        except json.JSONDecodeError as e:
            print(f"Error parsing ROLES env variable: {e}")
            print("All roles will use default grants_access = false")
        except Exception as e:
            print(f"Error updating grants_access values: {e}")
            raise
    else:
        print("No ROLES environment variable found - using default grants_access = false")


def downgrade() -> None:
    # Remove the grants_access column
    op.drop_column('roles', 'grants_access')
