"""auth enhancements and audit metadata

Revision ID: 20260219_0002
Revises: 20260219_0001
Create Date: 2026-02-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260219_0002"
down_revision: Union[str, Sequence[str], None] = "20260219_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("audit_logs", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_full_name", sa.String(length=255), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("ip_address", sa.String(length=64), nullable=True))

    op.create_table(
        "login_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_login_events_id", "login_events", ["id"], unique=False)
    op.create_index("ix_login_events_timestamp", "login_events", ["timestamp"], unique=False)
    op.create_index("ix_login_events_user_id", "login_events", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_login_events_user_id", table_name="login_events")
    op.drop_index("ix_login_events_timestamp", table_name="login_events")
    op.drop_index("ix_login_events_id", table_name="login_events")
    op.drop_table("login_events")

    with op.batch_alter_table("audit_logs", schema=None) as batch_op:
        batch_op.drop_column("ip_address")
        batch_op.drop_column("user_full_name")
