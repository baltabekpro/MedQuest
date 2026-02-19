from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientResponse])
def list_patients(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Patient).order_by(Patient.id.desc()).all()


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
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
        action="create",
        entity_type="patient",
        entity_id=patient.id,
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
        action="update",
        entity_type="patient",
        entity_id=patient.id,
        details=data,
    )

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_patient(
    patient_id: int,
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
        action="delete",
        entity_type="patient",
        entity_id=patient_id,
        details={"full_name": patient.full_name},
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
