from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import decode_token
from app.database import get_db
from app.models.staff_message import StaffMessage
from app.models.user import User
from app.schemas.chat import ChatContact, MessageCreate, MessageResponse

router = APIRouter(tags=["Chat"])


# ── WebSocket connection manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.active[user_id].append(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        self.active[user_id].remove(ws)
        if not self.active[user_id]:
            del self.active[user_id]

    async def send_to_user(self, user_id: int, payload: dict):
        for ws in list(self.active.get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                pass


manager = ConnectionManager()


# ── WebSocket endpoint ─────────────────────────────────────────────────────────
@router.websocket("/ws/chat/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    try:
        payload = decode_token(token, expected_type="access")
        user_id = int(payload["sub"])
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)

    # Mark undelivered messages as delivered
    db: Session = next(get_db())
    try:
        (
            db.query(StaffMessage)
            .filter(StaffMessage.receiver_id == user_id, StaffMessage.is_delivered.is_(False))
            .update({StaffMessage.is_delivered: True})
        )
        db.commit()
    finally:
        db.close()

    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            text = data.get("message_text", "").strip()
            if not receiver_id or not text:
                continue

            db: Session = next(get_db())
            try:
                msg = StaffMessage(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    message_text=text,
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                out = {
                    "type": "new_message",
                    "id": msg.id,
                    "sender_id": msg.sender_id,
                    "receiver_id": msg.receiver_id,
                    "message_text": msg.message_text,
                    "sent_at": msg.sent_at.isoformat(),
                    "is_delivered": msg.is_delivered,
                    "is_read": msg.is_read,
                }
            finally:
                db.close()

            await websocket.send_json(out)
            await manager.send_to_user(receiver_id, out)
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


# ── REST: get staff list (for new chat picker) ────────────────────────────────
@router.get("/chat/staff")
def get_staff(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.is_active.is_(True), User.id != current_user.id)
        .order_by(User.full_name)
        .all()
    )
    return [{"id": u.id, "full_name": u.full_name, "role": u.role} for u in users]


# ── REST: get contacts ─────────────────────────────────────────────────────────
@router.get("/chat/contacts", response_model=list[ChatContact])
def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.id != current_user.id, User.is_active.is_(True)).all()
    contacts = []
    for u in users:
        last_msg = (
            db.query(StaffMessage)
            .filter(
                or_(
                    (StaffMessage.sender_id == current_user.id) & (StaffMessage.receiver_id == u.id),
                    (StaffMessage.sender_id == u.id) & (StaffMessage.receiver_id == current_user.id),
                )
            )
            .order_by(StaffMessage.sent_at.desc())
            .first()
        )
        unread = (
            db.query(func.count())
            .select_from(StaffMessage)
            .filter(
                StaffMessage.sender_id == u.id,
                StaffMessage.receiver_id == current_user.id,
                StaffMessage.is_read.is_(False),
            )
            .scalar()
        )
        contacts.append(ChatContact(
            user_id=u.id,
            full_name=u.full_name,
            role=u.role,
            last_message=last_msg.message_text if last_msg else None,
            last_message_at=last_msg.sent_at if last_msg else None,
            unread_count=unread,
        ))
    contacts.sort(key=lambda c: c.last_message_at or datetime.min, reverse=True)
    return contacts


# ── REST: get messages with a user ─────────────────────────────────────────────
@router.get("/chat/messages/{user_id}", response_model=list[MessageResponse])
def get_messages(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msgs = (
        db.query(StaffMessage)
        .filter(
            or_(
                (StaffMessage.sender_id == current_user.id) & (StaffMessage.receiver_id == user_id),
                (StaffMessage.sender_id == user_id) & (StaffMessage.receiver_id == current_user.id),
            )
        )
        .order_by(StaffMessage.sent_at.asc())
        .limit(200)
        .all()
    )
    # Mark received messages as read
    (
        db.query(StaffMessage)
        .filter(
            StaffMessage.sender_id == user_id,
            StaffMessage.receiver_id == current_user.id,
            StaffMessage.is_read.is_(False),
        )
        .update({StaffMessage.is_read: True})
    )
    db.commit()
    return msgs


# ── REST: send message (non-WS fallback) ──────────────────────────────────────
@router.post("/chat/messages", response_model=MessageResponse)
def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = StaffMessage(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        message_text=payload.message_text,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
