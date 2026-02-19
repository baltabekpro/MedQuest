from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    *,
    user_id: int,
    user_full_name: str,
    action: str,
    entity_type: str,
    entity_id: int,
    ip_address: str | None = None,
    details: dict | None = None,
) -> None:
    log = AuditLog(
        user_id=user_id,
        user_full_name=user_full_name,
        ip_address=ip_address,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
    )
    db.add(log)
    db.commit()
