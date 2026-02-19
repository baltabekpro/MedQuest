from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.database import SessionLocal
from app.models import User
from app.routers import audit, auth, dashboard, patients, requests, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_database_ready()
    seed_admin_user()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Dashboard"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(requests.router)
app.include_router(dashboard.router)
app.include_router(audit.router)


def seed_admin_user() -> None:
    db: Session = SessionLocal()
    try:
        legacy_admin = db.query(User).filter(User.email == "admin@medquest.local").first()
        if legacy_admin:
            legacy_admin.email = "admin@medquest.kz"
            db.commit()

        admin = db.query(User).filter(User.email == "admin@medquest.kz").first()
        if admin:
            return

        admin = User(
            email="admin@medquest.kz",
            full_name="System Administrator",
            role="admin",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
        )
        db.add(admin)
        db.commit()
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
