from datetime import datetime

from pydantic import BaseModel


class NotificationItem(BaseModel):
    id: int
    title: str
    message: str | None = None
    href: str | None = None
    timestamp: datetime
    read: bool


class NotificationListResponse(BaseModel):
    unread_count: int
    items: list[NotificationItem]
