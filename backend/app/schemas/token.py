from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str
    totp_code: str | None = None


class GoogleLoginRequest(BaseModel):
    credential: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    requires_2fa: bool = False
    requires_role_selection: bool = False
    temp_token: str | None = None


class SelectRoleRequest(BaseModel):
    temp_token: str
    role: str
