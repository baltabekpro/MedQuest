from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PatientRequestCreate(BaseModel):
    patient_id: int
    title: str
    description: str
    priority: int = Field(default=3, ge=1, le=5)
    assigned_doctor_id: int | None = None


class PatientRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: int | None = Field(default=None, ge=1, le=5)
    assigned_doctor_id: int | None = None


class AssignDoctorRequest(BaseModel):
    doctor_id: int


class ChangeStatusRequest(BaseModel):
    status: str


class RequestCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class RequestCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    author_id: int
    author_full_name: str
    content: str
    created_at: datetime


class PatientRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    patient_full_name: str
    title: str
    description: str
    status: str
    priority: int
    assigned_doctor_id: int | None
    assigned_doctor_full_name: str | None
    created_by_id: int
    created_at: datetime
    updated_at: datetime
