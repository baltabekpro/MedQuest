"""add is_google_user to users

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "enterprise_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_google_user", sa.Boolean(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "is_google_user")
