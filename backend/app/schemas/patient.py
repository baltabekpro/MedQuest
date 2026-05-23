from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class PatientBase(BaseModel):
    full_name: str
    birth_date: date
    phone: str
    email: EmailStr | None = None
    address: str | None = None
    iin: str | None = None
    gender: str | None = None
    blood_type: str | None = None
    allergies: str | None = None
    notes: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value):
        if value == "":
            return None
        return value


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: str | None = None
    birth_date: date | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    iin: str | None = None
    gender: str | None = None
    blood_type: str | None = None
    allergies: str | None = None
    notes: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value):
        if value == "":
            return None
        return value


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    created_by_id: int
