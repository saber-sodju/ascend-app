from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base
from app.utils.guid import GUID


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    theme = Column(String, default="dark")
    target_weight = Column(String, nullable=True)
    language = Column(String, default="ru")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    body_measurements = relationship("BodyMeasurement", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    health_logs = relationship("HealthLog", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
