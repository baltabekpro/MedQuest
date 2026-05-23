import base64
import io

import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, Request, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models.login_event import LoginEvent
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginEventResponse,
    MessageResponse,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    UpdateProfileRequest,
)
from app.schemas.token import GoogleLoginRequest, LoginRequest, LoginResponse, RefreshRequest, TokenPair
from app.schemas.user import UserResponse
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/auth", tags=["Auth"])
REVOKED_REFRESH_TOKENS: set[str] = set()


def _record_login_event(
    db: Session,
    *,
    user_id: int | None,
    ip_address: str | None,
    user_agent: str | None,
    success: bool,
) -> None:
    event = LoginEvent(
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
    )
    db.add(event)
    db.commit()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        _record_login_event(
            db,
            user_id=user.id if user else None,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        _record_login_event(
            db,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive",
        )

    # 2FA check
    if user.is_2fa_enabled:
        if not payload.totp_code:
            return LoginResponse(requires_2fa=True)
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(payload.totp_code, valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный код 2FA",
            )

    _record_login_event(
        db,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        success=True,
    )
    create_audit_log(
        db,
        user_id=user.id,
        user_full_name=user.full_name,
        action="LOGIN",
        entity_type="User",
        entity_id=user.id,
        ip_address=ip_address,
        details={"success": True},
    )

    subject = str(user.id)
    return LoginResponse(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


@router.post("/google-login", response_model=LoginResponse)
def google_login(payload: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth не настроен")

    try:
        idinfo = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), settings.google_client_id
        )
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0] if email else "Google User")
        if not email:
            raise ValueError("Email not found in token")
    except Exception:
        raise HTTPException(status_code=401, detail="Неверный Google токен")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            hashed_password=get_password_hash("google-oauth-no-password"),
            role="registrar",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        _record_login_event(db, user_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False)
        raise HTTPException(status_code=401, detail="User inactive")

    _record_login_event(db, user_id=user.id, ip_address=ip_address, user_agent=user_agent, success=True)
    create_audit_log(
        db, user_id=user.id, user_full_name=user.full_name,
        action="LOGIN", entity_type="User", entity_id=user.id,
        ip_address=ip_address, details={"method": "google"},
    )

    subject = str(user.id)
    return LoginResponse(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(payload: RefreshRequest):
    if payload.refresh_token in REVOKED_REFRESH_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked",
        )

    try:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")
        subject = token_payload["sub"]
    except (ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return TokenPair(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UpdateProfileRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.department is not None:
        current_user.department = payload.department
    if payload.specialization is not None:
        current_user.specialization = payload.specialization
    db.commit()
    db.refresh(current_user)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details={"full_name": current_user.full_name},
    )
    return current_user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details={"password_changed": True},
    )
    return MessageResponse(message="Пароль успешно изменён")


@router.post("/2fa/enable", response_model=TwoFactorSetupResponse)
def enable_2fa(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA уже включена")

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="MedQuest CRM",
    )

    # Generate QR code as base64 PNG
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    # Temporarily store the secret (not yet enabled)
    current_user.totp_secret = secret
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details={"2fa_enable_initiated": True},
    )

    return TwoFactorSetupResponse(
        secret=secret,
        qr_code_base64=qr_base64,
        provisioning_uri=provisioning_uri,
    )


@router.post("/2fa/verify", response_model=MessageResponse)
def verify_2fa(
    payload: TwoFactorVerifyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Сначала инициализируйте 2FA через /auth/2fa/enable")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Неверный код")

    current_user.is_2fa_enabled = True
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details={"2fa_enabled": True},
    )

    return MessageResponse(message="2FA успешно активирована")


@router.post("/2fa/disable", response_model=MessageResponse)
def disable_2fa(
    payload: TwoFactorVerifyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA не включена")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Неверный код")

    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details={"2fa_disabled": True},
    )

    return MessageResponse(message="2FA отключена")


@router.get("/sessions", response_model=list[LoginEventResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(LoginEvent)
        .filter(LoginEvent.user_id == current_user.id)
        .order_by(LoginEvent.timestamp.desc())
        .limit(20)
        .all()
    )
    return [
        LoginEventResponse(
            id=row.id,
            user_id=row.user_id,
            timestamp=row.timestamp,
            ip_address=row.ip_address,
            user_agent=row.user_agent,
            success=row.success,
        )
        for row in rows
    ]


@router.post("/logout", response_model=MessageResponse)
def logout(payload: RefreshRequest):
    REVOKED_REFRESH_TOKENS.add(payload.refresh_token)
    return MessageResponse(message="Выход выполнен")
