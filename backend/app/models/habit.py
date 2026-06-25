from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Integer, Boolean, Text, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base
from app.utils.guid import GUID


class HabitFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class Habit(Base):
    __tablename__ = "habits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    frequency = Column(SAEnum(HabitFrequency), default=HabitFrequency.daily)
    target_value = Column(Float, default=1)
    unit = Column(String(50), nullable=True)
    color = Column(String(7), default="#6366f1")
    icon = Column(String(50), default="⭐")
    is_active = Column(Boolean, default=True)
    reminder_time = Column(String(5), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    habit_id = Column(GUID(), ForeignKey("habits.id"), nullable=False)
    date = Column(Date, nullable=False)
    value = Column(Float, default=1)
    completed = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    habit = relationship("Habit", back_populates="logs")
