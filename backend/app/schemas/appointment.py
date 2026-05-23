from datetime import datetime

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    doctor_id: int
    patient_id: int
    title: str = Field(max_length=255)
    start_time: datetime
    end_time: datetime
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    title: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: str | None = None
    notes: str | None = None


class AppointmentResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    title: str
    room_id: str | None
    start_time: datetime
    end_time: datetime
    status: str
    notes: str | None
    created_by_id: int
    created_at: datetime

    # joined fields
    doctor_name: str | None = None
    patient_name: str | None = None

    class Config:
        from_attributes = True
