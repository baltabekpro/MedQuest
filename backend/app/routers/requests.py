from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, aliased

from app.core.deps import get_current_user, require_roles
from app.database import get_db
from app.models.patient import Patient
from app.models.patient_request import PatientRequest
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.patient_request import (
    AssignDoctorRequest,
    ChangeStatusRequest,
    PatientRequestCreate,
    PatientRequestResponse,
    PatientRequestUpdate,
)
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/requests", tags=["Requests"])

VALID_STATUSES = {"new", "in_progress", "closed"}


def _apply_request_filters(
    query,
    *,
    status_filter: str | None,
    assigned_doctor_id: int | None,
    patient_id: int | None,
    priority: int | None,
    date_from: date | None,
    date_to: date | None,
    search: str | None,
):
    if status_filter is not None:
        query = query.filter(PatientRequest.status == status_filter)
    if assigned_doctor_id is not None:
        query = query.filter(PatientRequest.assigned_doctor_id == assigned_doctor_id)
    if patient_id is not None:
        query = query.filter(PatientRequest.patient_id == patient_id)
    if priority is not None:
        query = query.filter(PatientRequest.priority == priority)
    if date_from is not None:
        query = query.filter(PatientRequest.created_at >= datetime.combine(date_from, time.min))
    if date_to is not None:
        query = query.filter(PatientRequest.created_at <= datetime.combine(date_to, time.max))
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                PatientRequest.title.ilike(pattern),
                PatientRequest.description.ilike(pattern),
            )
        )
    return query


def _serialize_request_row(row) -> PatientRequestResponse:
    request_obj, patient_full_name, assigned_doctor_full_name = row
    return PatientRequestResponse(
        id=request_obj.id,
        patient_id=request_obj.patient_id,
        patient_full_name=patient_full_name,
        title=request_obj.title,
        description=request_obj.description,
        status=request_obj.status,
        priority=request_obj.priority,
        assigned_doctor_id=request_obj.assigned_doctor_id,
        assigned_doctor_full_name=assigned_doctor_full_name,
        created_by_id=request_obj.created_by_id,
        created_at=request_obj.created_at,
        updated_at=request_obj.updated_at,
    )


@router.get("", response_model=PaginatedResponse[PatientRequestResponse])
def list_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    assigned_doctor_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    priority: int | None = Query(default=None, ge=1, le=5),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    search: str | None = Query(default=None),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doctor_alias = aliased(User)

    count_query = db.query(PatientRequest)
    count_query = _apply_request_filters(
        count_query,
        status_filter=status_filter,
        assigned_doctor_id=assigned_doctor_id,
        patient_id=patient_id,
        priority=priority,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    total = count_query.count()

    query = (
        db.query(
            PatientRequest,
            Patient.full_name.label("patient_full_name"),
            doctor_alias.full_name.label("assigned_doctor_full_name"),
        )
        .join(Patient, Patient.id == PatientRequest.patient_id)
        .outerjoin(doctor_alias, doctor_alias.id == PatientRequest.assigned_doctor_id)
    )
    query = _apply_request_filters(
        query,
        status_filter=status_filter,
        assigned_doctor_id=assigned_doctor_id,
        patient_id=patient_id,
        priority=priority,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )

    rows = query.order_by(PatientRequest.id.desc()).offset((page - 1) * limit).limit(limit).all()
    items = [_serialize_request_row(row) for row in rows]

    return PaginatedResponse(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=PatientRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: PatientRequestCreate,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar", "doctor")),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    request_obj = PatientRequest(
        patient_id=payload.patient_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="new",
        created_by_id=current_user.id,
    )
    db.add(request_obj)
    db.commit()
    db.refresh(request_obj)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="CREATE",
        entity_type="PatientRequest",
        entity_id=request_obj.id,
        ip_address=request.client.host if request and request.client else None,
        details={"title": request_obj.title, "status": request_obj.status},
    )

    return PatientRequestResponse(
        id=request_obj.id,
        patient_id=request_obj.patient_id,
        patient_full_name=patient.full_name,
        title=request_obj.title,
        description=request_obj.description,
        status=request_obj.status,
        priority=request_obj.priority,
        assigned_doctor_id=request_obj.assigned_doctor_id,
        assigned_doctor_full_name=None,
        created_by_id=request_obj.created_by_id,
        created_at=request_obj.created_at,
        updated_at=request_obj.updated_at,
    )


@router.get("/{request_id}", response_model=PatientRequestResponse)
def get_request(
    request_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doctor_alias = aliased(User)
    row = (
        db.query(
            PatientRequest,
            Patient.full_name.label("patient_full_name"),
            doctor_alias.full_name.label("assigned_doctor_full_name"),
        )
        .join(Patient, Patient.id == PatientRequest.patient_id)
        .outerjoin(doctor_alias, doctor_alias.id == PatientRequest.assigned_doctor_id)
        .filter(PatientRequest.id == request_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    return _serialize_request_row(row)


@router.put("/{request_id}", response_model=PatientRequestResponse)
def update_request(
    request_id: int,
    payload: PatientRequestUpdate,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar", "doctor")),
    db: Session = Depends(get_db),
):
    request_obj = db.query(PatientRequest).filter(PatientRequest.id == request_id).first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found")

    data = payload.model_dump(exclude_unset=True)
    new_status = data.get("status")
    if new_status is not None and new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    for key, value in data.items():
        setattr(request_obj, key, value)

    db.commit()
    db.refresh(request_obj)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="PatientRequest",
        entity_id=request_obj.id,
        ip_address=request.client.host if request and request.client else None,
        details=data,
    )
    patient = db.query(Patient).filter(Patient.id == request_obj.patient_id).first()
    doctor = None
    if request_obj.assigned_doctor_id:
        doctor = db.query(User).filter(User.id == request_obj.assigned_doctor_id).first()

    return PatientRequestResponse(
        id=request_obj.id,
        patient_id=request_obj.patient_id,
        patient_full_name=patient.full_name if patient else "",
        title=request_obj.title,
        description=request_obj.description,
        status=request_obj.status,
        priority=request_obj.priority,
        assigned_doctor_id=request_obj.assigned_doctor_id,
        assigned_doctor_full_name=doctor.full_name if doctor else None,
        created_by_id=request_obj.created_by_id,
        created_at=request_obj.created_at,
        updated_at=request_obj.updated_at,
    )


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar")),
    db: Session = Depends(get_db),
):
    request_obj = db.query(PatientRequest).filter(PatientRequest.id == request_id).first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found")

    db.delete(request_obj)
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="DELETE",
        entity_type="PatientRequest",
        entity_id=request_id,
        ip_address=request.client.host if request and request.client else None,
        details={"title": request_obj.title},
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{request_id}/status", response_model=PatientRequestResponse)
def change_request_status(
    request_id: int,
    payload: ChangeStatusRequest,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar", "doctor")),
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    request_obj = db.query(PatientRequest).filter(PatientRequest.id == request_id).first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found")

    request_obj.status = payload.status
    db.commit()
    db.refresh(request_obj)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="PatientRequest",
        entity_id=request_obj.id,
        ip_address=request.client.host if request and request.client else None,
        details={"status": payload.status},
    )
    patient = db.query(Patient).filter(Patient.id == request_obj.patient_id).first()
    doctor = None
    if request_obj.assigned_doctor_id:
        doctor = db.query(User).filter(User.id == request_obj.assigned_doctor_id).first()

    return PatientRequestResponse(
        id=request_obj.id,
        patient_id=request_obj.patient_id,
        patient_full_name=patient.full_name if patient else "",
        title=request_obj.title,
        description=request_obj.description,
        status=request_obj.status,
        priority=request_obj.priority,
        assigned_doctor_id=request_obj.assigned_doctor_id,
        assigned_doctor_full_name=doctor.full_name if doctor else None,
        created_by_id=request_obj.created_by_id,
        created_at=request_obj.created_at,
        updated_at=request_obj.updated_at,
    )


@router.patch("/{request_id}/assign", response_model=PatientRequestResponse)
def assign_doctor(
    request_id: int,
    payload: AssignDoctorRequest,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar")),
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(User)
        .filter(User.id == payload.doctor_id, User.role == "doctor", User.is_active.is_(True))
        .first()
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    request_obj = db.query(PatientRequest).filter(PatientRequest.id == request_id).first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found")

    request_obj.assigned_doctor_id = payload.doctor_id
    db.commit()
    db.refresh(request_obj)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="PatientRequest",
        entity_id=request_obj.id,
        ip_address=request.client.host if request and request.client else None,
        details={"doctor_id": payload.doctor_id},
    )
    patient = db.query(Patient).filter(Patient.id == request_obj.patient_id).first()

    return PatientRequestResponse(
        id=request_obj.id,
        patient_id=request_obj.patient_id,
        patient_full_name=patient.full_name if patient else "",
        title=request_obj.title,
        description=request_obj.description,
        status=request_obj.status,
        priority=request_obj.priority,
        assigned_doctor_id=request_obj.assigned_doctor_id,
        assigned_doctor_full_name=doctor.full_name,
        created_by_id=request_obj.created_by_id,
        created_at=request_obj.created_at,
        updated_at=request_obj.updated_at,
    )
