"""request comments

Revision ID: 20260219_0004
Revises: 20260219_0003
Create Date: 2026-02-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260219_0004"
down_revision: Union[str, Sequence[str], None] = "20260219_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "request_comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["request_id"], ["patient_requests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_request_comments_id"), "request_comments", ["id"], unique=False)
    op.create_index(op.f("ix_request_comments_request_id"), "request_comments", ["request_id"], unique=False)
    op.create_index(op.f("ix_request_comments_author_id"), "request_comments", ["author_id"], unique=False)
    op.create_index(op.f("ix_request_comments_created_at"), "request_comments", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_request_comments_created_at"), table_name="request_comments")
    op.drop_index(op.f("ix_request_comments_author_id"), table_name="request_comments")
    op.drop_index(op.f("ix_request_comments_request_id"), table_name="request_comments")
    op.drop_index(op.f("ix_request_comments_id"), table_name="request_comments")
    op.drop_table("request_comments")