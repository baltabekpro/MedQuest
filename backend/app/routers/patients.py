from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=PaginatedResponse[PatientResponse])
def list_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(default=None),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Patient)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(pattern),
                Patient.phone.ilike(pattern),
                Patient.email.ilike(pattern),
            )
        )

    total = query.count()
    items = query.order_by(Patient.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return PaginatedResponse(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar")),
    db: Session = Depends(get_db),
):
    patient = Patient(**payload.model_dump(), created_by_id=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="CREATE",
        entity_type="Patient",
        entity_id=patient.id,
        ip_address=request.client.host if request and request.client else None,
        details={"full_name": patient.full_name},
    )

    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar")),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="Patient",
        entity_id=patient.id,
        ip_address=request.client.host if request and request.client else None,
        details=data,
    )

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_patient(
    patient_id: int,
    request: Request,
    current_user: User = Depends(require_roles("admin", "registrar")),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="DELETE",
        entity_type="Patient",
        entity_id=patient_id,
        ip_address=request.client.host if request and request.client else None,
        details={"full_name": patient.full_name},
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
