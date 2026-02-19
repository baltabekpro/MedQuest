from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class PatientBase(BaseModel):
    full_name: str
    birth_date: date
    phone: str
    email: EmailStr | None = None
    address: str | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: str | None = None
    birth_date: date | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    created_by_id: int
