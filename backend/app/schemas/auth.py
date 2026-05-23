from datetime import datetime

from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class MessageResponse(BaseModel):
    message: str


class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    provisioning_uri: str


class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class LoginEventResponse(BaseModel):
    id: int
    user_id: int | None
    timestamp: datetime
    ip_address: str | None
    user_agent: str | None
    success: bool
