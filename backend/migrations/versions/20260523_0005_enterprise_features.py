"""Enterprise features: appointments, staff_messages, 2FA, extended profiles

Revision ID: enterprise_001
Revises: 20260219_0004
Create Date: 2026-05-23
"""

from alembic import op
import sqlalchemy as sa

revision = "enterprise_001"
down_revision = "20260219_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 2FA fields on users ──────────────────────────────────────────────
    op.add_column("users", sa.Column("totp_secret", sa.String(32), nullable=True))
    op.add_column("users", sa.Column("is_2fa_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("users", sa.Column("phone", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("specialization", sa.String(255), nullable=True))

    # ── Extended patient fields ──────────────────────────────────────────
    op.add_column("patients", sa.Column("iin", sa.String(12), nullable=True))
    op.add_column("patients", sa.Column("gender", sa.String(20), nullable=True))
    op.add_column("patients", sa.Column("blood_type", sa.String(10), nullable=True))
    op.add_column("patients", sa.Column("allergies", sa.String(1000), nullable=True))
    op.add_column("patients", sa.Column("notes", sa.String(2000), nullable=True))

    # ── Staff messages table ─────────────────────────────────────────────
    op.create_table(
        "staff_messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("receiver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("message_text", sa.String(5000), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_delivered", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_staff_messages_sender_id", "staff_messages", ["sender_id"])
    op.create_index("ix_staff_messages_receiver_id", "staff_messages", ["receiver_id"])

    # ── Appointments table ───────────────────────────────────────────────
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("room_id", sa.String(255), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="scheduled"),
        sa.Column("notes", sa.String(1000), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_appointments_doctor_id", "appointments", ["doctor_id"])
    op.create_index("ix_appointments_patient_id", "appointments", ["patient_id"])
    op.create_index("ix_appointments_status", "appointments", ["status"])


def downgrade() -> None:
    op.drop_table("appointments")
    op.drop_table("staff_messages")

    for col in ["notes", "allergies", "blood_type", "gender", "iin"]:
        op.drop_column("patients", col)

    for col in ["specialization", "department", "avatar_url", "phone", "is_2fa_enabled", "totp_secret"]:
        op.drop_column("users", col)
