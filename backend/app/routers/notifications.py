from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.notification_state import NotificationState
from app.models.patient_request import PatientRequest
from app.models.user import User
from app.schemas.notifications import NotificationItem, NotificationListResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _ensure_state(db: Session, user_id: int) -> NotificationState:
    state = db.query(NotificationState).filter(NotificationState.user_id == user_id).first()
    if state:
        return state
    state = NotificationState(user_id=user_id)
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def _format_title(item: AuditLog, *, doctor_name: str | None = None) -> tuple[str, str | None, str | None]:
    href: str | None = None
    msg: str | None = None

    if item.entity_type == "PatientRequest":
        href = f"/requests/{item.entity_id}"
        if item.action == "CREATE":
            title = "Создан новый запрос"
            msg = f"Запрос #{item.entity_id} создан"
            return title, msg, href

        if item.action == "UPDATE":
            details = item.details or {}
            if isinstance(details, dict) and "status" in details:
                title = "Изменён статус запроса"
                msg = f"Запрос #{item.entity_id}: статус обновлён"
                return title, msg, href
            if isinstance(details, dict) and "doctor_id" in details:
                title = "Назначен врач"
                msg = f"Запрос #{item.entity_id}: назначен врач{f' ({doctor_name})' if doctor_name else ''}"
                return title, msg, href
            title = "Обновлён запрос"
            msg = f"Запрос #{item.entity_id} обновлён"
            return title, msg, href

        if item.action == "DELETE":
            title = "Удалён запрос"
            msg = f"Запрос #{item.entity_id} удалён"
            return title, msg, href

    if item.entity_type == "Patient":
        href = f"/patients/{item.entity_id}"
        if item.action == "CREATE":
            return "Добавлен пациент", f"Пациент #{item.entity_id} добавлен", href
        if item.action == "UPDATE":
            return "Обновлён пациент", f"Пациент #{item.entity_id} обновлён", href
        if item.action == "DELETE":
            return "Удалён пациент", f"Пациент #{item.entity_id} удалён", href

    if item.entity_type == "User" and item.action == "LOGIN":
        return "Вход в систему", "Выполнен вход в систему", None

    return f"{item.action} · {item.entity_type}", None, href


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    state = _ensure_state(db, current_user.id)

    base_query = db.query(AuditLog).order_by(AuditLog.id.desc())

    # Role-based visibility:
    # - admin: all
    # - registrar: only Patient + PatientRequest
    # - doctor: only PatientRequest events relevant to this doctor
    if current_user.role == "registrar":
        base_query = base_query.filter(AuditLog.entity_type.in_(["Patient", "PatientRequest"]))

    if current_user.role != "doctor":
        rows = base_query.limit(limit).all()
        unread_count = (
            base_query.filter(AuditLog.timestamp > state.last_seen_at)
            .with_entities(AuditLog.id)
            .count()
        )
    else:
        # SQLite JSON filtering can be unreliable; do an efficient 2-step filtering in Python.
        candidate_rows = (
            base_query.filter(AuditLog.entity_type == "PatientRequest").limit(200).all()
        )
        request_ids = [r.entity_id for r in candidate_rows]
        assigned_map = {
            r.id: r.assigned_doctor_id
            for r in db.query(PatientRequest.id, PatientRequest.assigned_doctor_id)
            .filter(PatientRequest.id.in_(request_ids))
            .all()
        }

        def relevant(r: AuditLog) -> bool:
            if assigned_map.get(r.entity_id) == current_user.id:
                return True
            if isinstance(r.details, dict) and r.details.get("doctor_id") == current_user.id:
                return True
            return False

        filtered = [r for r in candidate_rows if relevant(r)]
        rows = filtered[:limit]
        unread_count = sum(1 for r in filtered if r.timestamp > state.last_seen_at)

    items: list[NotificationItem] = []
    for row in rows:
        doctor_name: str | None = None
        if row.entity_type == "PatientRequest" and row.action == "UPDATE" and isinstance(row.details, dict) and "doctor_id" in row.details:
            doctor = db.query(User).filter(User.id == row.details.get("doctor_id")).first()
            doctor_name = doctor.full_name if doctor else None

        title, message, href = _format_title(row, doctor_name=doctor_name)
        items.append(
            NotificationItem(
                id=row.id,
                title=title,
                message=message,
                href=href,
                timestamp=row.timestamp,
                read=row.timestamp <= state.last_seen_at,
            )
        )

    return NotificationListResponse(unread_count=unread_count, items=items)


@router.post("/mark-read")
def mark_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    state = _ensure_state(db, current_user.id)
    state.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "last_seen_at": state.last_seen_at}
