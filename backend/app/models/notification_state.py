from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NotificationState(Base):
    __tablename__ = "notification_states"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
