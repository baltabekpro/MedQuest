import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.database import SessionLocal
from app.models import User
from app.routers import audit, auth, chat, classifier, dashboard, notifications, patients, requests, schedule, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_database_ready()
    seed_admin_user()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    root_path=os.getenv("ROOT_PATH", ""),
)

_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", *_extra_origins],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Dashboard"])
def health():
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok", "service": "medquest-backend", "docs": "/docs"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(requests.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(classifier.router)
app.include_router(chat.router)
app.include_router(schedule.router)

os.makedirs("/app/uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

def seed_admin_user() -> None:
    db: Session = SessionLocal()
    try:
        legacy_admin = db.query(User).filter(User.email == "admin@medquest.local").first()
        if legacy_admin:
            legacy_admin.email = "admin@medquest.kz"
            db.commit()

        def ensure_user(*, email: str, full_name: str, role: str, password: str) -> None:
            from sqlalchemy.dialects.sqlite import insert as sqlite_insert
            from sqlalchemy import inspect as sa_inspect
            stmt = (
                sqlite_insert(User)
                .values(
                    email=email,
                    full_name=full_name,
                    role=role,
                    hashed_password=get_password_hash(password),
                    is_active=True,
                )
                .on_conflict_do_nothing(index_elements=["email"])
            )
            db.execute(stmt)
            db.commit()

        ensure_user(
            email="admin@medquest.kz",
            full_name="System Administrator",
            role="admin",
            password="admin123",
        )
        ensure_user(
            email="registrar@medquest.kz",
            full_name="Registrar Demo",
            role="registrar",
            password="registrar123",
        )
        ensure_user(
            email="doctor@medquest.kz",
            full_name="Doctor Demo",
            role="doctor",
            password="doctor123",
        )
    finally:
        db.close()


def ensure_database_ready() -> None:
    db: Session = SessionLocal()
    try:
        db.query(User.id).first()
    except OperationalError as exc:
        raise RuntimeError(
            "Database schema is not initialized. Run `alembic upgrade head` in backend/ before starting API."
        ) from exc
    finally:
        db.close()
