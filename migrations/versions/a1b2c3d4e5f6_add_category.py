"""add category

Revision ID: a1b2c3d4e5f6
Revises: 0080bfbdc7f8
Create Date: 2026-02-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '0080bfbdc7f8'
branch_labels = None
depends_on = None

PREDEFINED_CATEGORIES = [
    'Business',
    'Education',
    'Entertainment',
    'Health',
    'Lifestyle',
    'Other',
    'Politics',
    'Science',
    'Sports',
    'Technology',
]


def upgrade():
    op.create_table(
        'category',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    with op.batch_alter_table('article', schema=None) as batch_op:
        batch_op.add_column(sa.Column('category_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_article_category', 'category', ['category_id'], ['id'])

    # Seed predefined categories
    category_table = table('category', column('name', sa.String))
    op.bulk_insert(category_table, [{'name': name} for name in PREDEFINED_CATEGORIES])


def downgrade():
    with op.batch_alter_table('article', schema=None) as batch_op:
        batch_op.drop_constraint('fk_article_category', type_='foreignkey')
        batch_op.drop_column('category_id')

    op.drop_table('category')
