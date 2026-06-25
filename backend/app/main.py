from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.routers import auth, goals, habits, tasks, finance, health, journal, dashboard, reports, analytics, users
from app.utils.security import get_password_hash
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Life Manager API",
    description="Personal Life Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(goals.router, prefix="/api/v1")
app.include_router(habits.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(finance.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(journal.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.models.user import User
        existing = db.query(User).first()
        if not existing:
            user = User(
                email=settings.FIRST_USER_EMAIL,
                username=settings.FIRST_USER_USERNAME,
                full_name=settings.FIRST_USER_FULLNAME,
                hashed_password=get_password_hash(settings.FIRST_USER_PASSWORD),
                is_admin=True,
            )
            db.add(user)
            db.commit()
            logger.info(f"Created initial admin user: {settings.FIRST_USER_USERNAME}")
        else:
            # Ensure first user is always admin
            if not existing.is_admin:
                existing.is_admin = True
                db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Life Manager API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
