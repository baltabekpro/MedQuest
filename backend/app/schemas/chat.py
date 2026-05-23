from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    receiver_id: int
    message_text: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message_text: str
    sent_at: datetime
    is_delivered: bool
    is_read: bool

    class Config:
        from_attributes = True


class ChatContact(BaseModel):
    user_id: int
    full_name: str
    role: str
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
