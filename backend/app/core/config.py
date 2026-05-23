import os

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "MedQuest CRM API"
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 60 * 24 * 7
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")


settings = Settings()
