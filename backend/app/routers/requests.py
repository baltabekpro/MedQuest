from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.database import get_db
from app.models.patient import Patient
from app.models.patient_request import PatientRequest
from app.models.user import User
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


@router.get("", response_model=list[PatientRequestResponse])
def list_requests(
    status_filter: str | None = Query(default=None, alias="status"),
    assigned_doctor_id: int | None = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PatientRequest)

    if status_filter is not None:
        query = query.filter(PatientRequest.status == status_filter)
    if assigned_doctor_id is not None:
        query = query.filter(PatientRequest.assigned_doctor_id == assigned_doctor_id)

    return query.order_by(PatientRequest.id.desc()).all()


@router.post("", response_model=PatientRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: PatientRequestCreate,
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
        action="create",
        entity_type="request",
        entity_id=request_obj.id,
        details={"title": request_obj.title, "status": request_obj.status},
    )

    return request_obj


@router.get("/{request_id}", response_model=PatientRequestResponse)
def get_request(
    request_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request_obj = db.query(PatientRequest).filter(PatientRequest.id == request_id).first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found")
    return request_obj


@router.put("/{request_id}", response_model=PatientRequestResponse)
def update_request(
    request_id: int,
    payload: PatientRequestUpdate,
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
        action="update",
        entity_type="request",
        entity_id=request_obj.id,
        details=data,
    )

    return request_obj


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_request(
    request_id: int,
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
        action="delete",
        entity_type="request",
        entity_id=request_id,
        details={"title": request_obj.title},
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{request_id}/status", response_model=PatientRequestResponse)
def change_request_status(
    request_id: int,
    payload: ChangeStatusRequest,
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
        action="change_status",
        entity_type="request",
        entity_id=request_obj.id,
        details={"status": payload.status},
    )

    return request_obj


@router.patch("/{request_id}/assign", response_model=PatientRequestResponse)
def assign_doctor(
    request_id: int,
    payload: AssignDoctorRequest,
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
        action="assign_doctor",
        entity_type="request",
        entity_id=request_obj.id,
        details={"doctor_id": payload.doctor_id},
    )

    return request_obj
