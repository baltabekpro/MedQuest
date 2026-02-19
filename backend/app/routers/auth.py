from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

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
from app.schemas.auth import ChangePasswordRequest, LoginEventResponse, MessageResponse, UpdateProfileRequest
from app.schemas.token import LoginRequest, RefreshRequest, TokenPair
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


@router.post("/login", response_model=TokenPair)
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
    return TokenPair(
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
    current_user.full_name = payload.full_name
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
