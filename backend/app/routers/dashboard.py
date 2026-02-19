from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.patient import Patient
from app.models.patient_request import PatientRequest
from app.models.user import User
from app.schemas.dashboard import DashboardActivityPoint, DashboardStats, DashboardWeeklyActivity

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


_WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]


@router.get("/activity", response_model=DashboardWeeklyActivity)
def weekly_activity(
    days: int = 7,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = max(1, min(days, 30))

    today_utc: date = datetime.now(timezone.utc).date()
    start_date = today_utc - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

    # SQLite: func.date(timestamp) -> 'YYYY-MM-DD'
    rows = (
        db.query(func.date(AuditLog.timestamp).label("d"), func.count(AuditLog.id).label("c"))
        .filter(AuditLog.timestamp >= start_dt)
        .group_by("d")
        .all()
    )
    counts_by_date = {str(r.d): int(r.c) for r in rows if r.d is not None}

    points: list[DashboardActivityPoint] = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        points.append(
            DashboardActivityPoint(
                date=d_str,
                day=_WEEKDAYS_RU[d.weekday()],
                value=counts_by_date.get(d_str, 0),
            )
        )

    return DashboardWeeklyActivity(days=days, points=points)


@router.get("/stats", response_model=DashboardStats)
def stats(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    utc_today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_requests = db.query(func.count(PatientRequest.id)).scalar() or 0
    requests_new = db.query(func.count(PatientRequest.id)).filter(PatientRequest.status == "new").scalar() or 0
    requests_in_progress = (
        db.query(func.count(PatientRequest.id)).filter(PatientRequest.status == "in_progress").scalar() or 0
    )
    requests_closed = (
        db.query(func.count(PatientRequest.id)).filter(PatientRequest.status == "closed").scalar() or 0
    )
    requests_closed_today = (
        db.query(func.count(PatientRequest.id))
        .filter(PatientRequest.status == "closed", PatientRequest.updated_at >= utc_today_start)
        .scalar()
        or 0
    )

    return DashboardStats(
        total_patients=total_patients,
        total_requests=total_requests,
        requests_new=requests_new,
        requests_in_progress=requests_in_progress,
        requests_closed=requests_closed,
        requests_closed_today=requests_closed_today,
    )
