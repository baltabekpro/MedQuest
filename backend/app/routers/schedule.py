import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
)

router = APIRouter(prefix="/schedule", tags=["Schedule"])


def _appointment_to_response(appt: Appointment, doctor_name: str | None, patient_name: str | None) -> AppointmentResponse:
    return AppointmentResponse(
        id=appt.id,
        doctor_id=appt.doctor_id,
        patient_id=appt.patient_id,
        title=appt.title,
        room_id=appt.room_id,
        start_time=appt.start_time,
        end_time=appt.end_time,
        status=appt.status,
        notes=appt.notes,
        created_by_id=appt.created_by_id,
        created_at=appt.created_at,
        doctor_name=doctor_name,
        patient_name=patient_name,
    )


def _generate_room_id(doctor_id: int, patient_id: int, start_time: datetime) -> str:
    raw = f"{doctor_id}-{patient_id}-{start_time.isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _check_collision(db: Session, doctor_id: int, start: datetime, end: datetime, exclude_id: int | None = None):
    q = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status != "cancelled",
        Appointment.start_time < end,
        Appointment.end_time > start,
    )
    if exclude_id:
        q = q.filter(Appointment.id != exclude_id)
    if q.first():
        raise HTTPException(status_code=409, detail="Временной слот пересекается с другим приёмом")


@router.get("/appointments", response_model=list[AppointmentResponse])
def list_appointments(
    doctor_id: int | None = None,
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Appointment)
    # Privacy: doctor/nurse see only their own appointments
    if current_user.role in ("doctor", "nurse"):
        q = q.filter(Appointment.doctor_id == current_user.id)
    elif doctor_id:
        q = q.filter(Appointment.doctor_id == doctor_id)
    if date_from:
        q = q.filter(Appointment.start_time >= date_from)
    if date_to:
        q = q.filter(Appointment.end_time <= date_to)
    q = q.order_by(Appointment.start_time.asc()).limit(500)

    results = []
    for appt in q.all():
        doc = db.query(User).filter(User.id == appt.doctor_id).first()
        pat = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        results.append(_appointment_to_response(appt, doc.full_name if doc else None, pat.full_name if pat else None))
    return results


@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="Время окончания должно быть позже начала")

    _check_collision(db, payload.doctor_id, payload.start_time, payload.end_time)

    room_id = _generate_room_id(payload.doctor_id, payload.patient_id, payload.start_time)

    appt = Appointment(
        doctor_id=payload.doctor_id,
        patient_id=payload.patient_id,
        title=payload.title,
        room_id=room_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        notes=payload.notes,
        created_by_id=current_user.id,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    doc = db.query(User).filter(User.id == appt.doctor_id).first()
    pat = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    return _appointment_to_response(appt, doc.full_name if doc else None, pat.full_name if pat else None)


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Приём не найден")

    update_data = payload.model_dump(exclude_unset=True)

    if "start_time" in update_data or "end_time" in update_data:
        start = update_data.get("start_time", appt.start_time)
        end = update_data.get("end_time", appt.end_time)
        if end <= start:
            raise HTTPException(status_code=400, detail="Время окончания должно быть позже начала")
        _check_collision(db, appt.doctor_id, start, end, exclude_id=appt.id)

    for key, val in update_data.items():
        setattr(appt, key, val)
    db.commit()
    db.refresh(appt)

    doc = db.query(User).filter(User.id == appt.doctor_id).first()
    pat = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    return _appointment_to_response(appt, doc.full_name if doc else None, pat.full_name if pat else None)


@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Приём не найден")
    db.delete(appt)
    db.commit()
