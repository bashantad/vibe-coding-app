"""rename comment body to description

Revision ID: 74af4e949b0b
Revises: 159b7ff77f49
Create Date: 2026-02-17 21:30:23.109505

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '74af4e949b0b'
down_revision = '159b7ff77f49'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('comment', 'body', new_column_name='description')


def downgrade():
    op.alter_column('comment', 'description', new_column_name='body')
