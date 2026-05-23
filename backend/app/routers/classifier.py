from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.classifier import (
    AlternativeSpecialty,
    ComplaintRequest,
    RoutingResponse,
)

router = APIRouter(prefix="/api/v1/classifier", tags=["AI Classifier"])

SPECIALTIES = {
    1: "Терапевт",
    2: "Офтальмолог",
    3: "Кардиолог",
    4: "Невролог",
    5: "ЛОР",
    6: "Травматолог",
    7: "Гастроэнтеролог",
    8: "Дерматолог",
    9: "Уролог",
    10: "Гинеколог",
}

SPECIALTIES_LIST = "\n".join(f"  {sid} — {name}" for sid, name in SPECIALTIES.items())


def _build_prompt(complaint_text: str) -> str:
    return f"""Ты — медицинский координатор в казахстанской клинике MedQuest.
Пациент обратился с жалобой: "{complaint_text}"

Определи, к какому узкому специалисту направить пациента.

Доступные специализации:
{SPECIALTIES_LIST}

Верни СТРОГО JSON в следующем формате (без markdown, без ```):
{{
  "recommended_specialty_id": <число>,
  "recommended_specialty_name": "<название>",
  "confidence": <от 0.0 до 1.0>,
  "reasoning": "<краткое объяснение на русском>",
  "alternative_specialties": [
    {{"specialty_id": <число>, "specialty_name": "<название>", "confidence": <от 0.0 до 1.0>}}
  ]
}}

Если жалоба не медицинская, верни recommended_specialty_id=1 (Терапевт) с confidence=0.1."""


@router.post("/route-complaint", response_model=RoutingResponse)
async def route_complaint(
    request: ComplaintRequest,
    _current_user: User = Depends(get_current_user),
):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY не настроен на сервере")

    try:
        import google.generativeai as genai
    except ImportError:
        raise HTTPException(status_code=500, detail="google-generativeai не установлен")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-3.5-flash")

    prompt = _build_prompt(request.complaint_text)

    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )
        return RoutingResponse.model_validate_json(response.text)
    except ValidationError:
        raw = response.text if response.text else ""
        raise HTTPException(status_code=502, detail=f"Gemini вернул невалидный JSON: {raw[:500]}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ошибка Gemini API: {exc}")


@router.get("/specialties")
async def get_specialties():
    return [{"id": sid, "name": name} for sid, name in SPECIALTIES.items()]
