from pydantic import BaseModel, Field


class ComplaintRequest(BaseModel):
    complaint_text: str = Field(..., min_length=3, max_length=2000, description="Жалоба пациента в свободной форме")


class AlternativeSpecialty(BaseModel):
    specialty_id: int
    specialty_name: str
    confidence: float = Field(ge=0.0, le=1.0)


class RoutingResponse(BaseModel):
    recommended_specialty_id: int
    recommended_specialty_name: str
    confidence: float = Field(ge=0.0, le=1.0, description="Уверенность модели от 0.0 до 1.0")
    reasoning: str = Field(default="", description="Краткое объяснение выбора")
    alternative_specialties: list[AlternativeSpecialty] = Field(default_factory=list)
