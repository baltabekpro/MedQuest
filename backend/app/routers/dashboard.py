from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.patient import Patient
from app.models.patient_request import PatientRequest
from app.models.user import User
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


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
