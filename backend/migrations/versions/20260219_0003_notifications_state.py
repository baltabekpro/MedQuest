"""notifications state

Revision ID: 20260219_0003
Revises: 20260219_0002
Create Date: 2026-02-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260219_0003"
down_revision: Union[str, Sequence[str], None] = "20260219_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_states",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index(
        "ix_notification_states_last_seen_at",
        "notification_states",
        ["last_seen_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notification_states_last_seen_at", table_name="notification_states")
    op.drop_table("notification_states")
