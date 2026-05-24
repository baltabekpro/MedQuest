import os
import secrets
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, UploadFile, File, status
from fastapi.responses import FileResponse

from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.audit_service import create_audit_log


class GeneratedPasswordResponse(BaseModel):
    password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


class AvatarResponse(BaseModel):
    avatar_url: str


UPLOAD_DIR = "/app/uploads/avatars"

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    current_user: User = Depends(require_roles("admin", "doctor")),
    db: Session = Depends(get_db),
):
    if current_user.role == "doctor":
        if role != "doctor":
            raise HTTPException(status_code=403, detail="Doctors can view only doctors list")

    query = db.query(User)

    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    items = query.order_by(User.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return PaginatedResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="CREATE",
        entity_type="User",
        entity_id=user.id,
        ip_address=request.client.host if request and request.client else None,
        details={"email": user.email, "role": user.role},
    )

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=user.id,
        ip_address=request.client.host if request and request.client else None,
        details=data,
    )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="DELETE",
        entity_type="User",
        entity_id=user_id,
        ip_address=request.client.host if request and request.client else None,
        details={"email": user.email},
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{user_id}/generate-password", response_model=GeneratedPasswordResponse)
def generate_password(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(16))
    user.hashed_password = get_password_hash(password)
    user.is_google_user = False
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=user.id,
        ip_address=request.client.host if request and request.client else None,
        details={"password_generated": True},
    )

    return GeneratedPasswordResponse(password=password)


@router.post("/{user_id}/reset-password", response_model=GeneratedPasswordResponse)
def reset_password(
    user_id: int,
    payload: ResetPasswordRequest,
    request: Request,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(payload.new_password)
    if user.is_google_user:
        user.is_google_user = False
    db.commit()

    create_audit_log(
        db,
        user_id=current_user.id,
        user_full_name=current_user.full_name,
        action="UPDATE",
        entity_type="User",
        entity_id=user.id,
        ip_address=request.client.host if request and request.client else None,
        details={"password_reset": True},
    )

    return GeneratedPasswordResponse(password=payload.new_password)


@router.post("/{user_id}/avatar", response_model=AvatarResponse)
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Нет прав для загрузки аватара этого пользователя")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{user_id}_{int(datetime.now().timestamp())}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 5 МБ)")

    with open(filepath, "wb") as f:
        f.write(content)

    avatar_url = f"/uploads/avatars/{filename}"
    user.avatar_url = avatar_url
    db.commit()

    return AvatarResponse(avatar_url=avatar_url)


@router.get("/{user_id}/avatar")
def get_avatar(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.avatar_url:
        raise HTTPException(status_code=404, detail="Avatar not found")

    filepath = os.path.join("/app", user.avatar_url.lstrip("/"))
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Avatar file not found")

    return FileResponse(filepath, media_type="image/png")
