from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date, datetime
from app.models.habit import HabitFrequency
import uuid


class HabitLogBase(BaseModel):
    date: date
    value: float = 1
    completed: bool = True
    notes: Optional[str] = None


class HabitLogCreate(HabitLogBase):
    habit_id: uuid.UUID


class HabitLogResponse(HabitLogBase):
    id: uuid.UUID
    habit_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class HabitBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    frequency: HabitFrequency = HabitFrequency.daily
    target_value: float = 1
    unit: Optional[str] = None
    color: str = "#6366f1"
    icon: str = "⭐"
    reminder_time: Optional[str] = None


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    frequency: Optional[HabitFrequency] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    reminder_time: Optional[str] = None


class HabitResponse(HabitBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    current_streak: int = 0
    longest_streak: int = 0
    completion_rate: float = 0
    logs: List[HabitLogResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class HabitToggleRequest(BaseModel):
    date: date
    completed: bool = True
    value: float = 1
    notes: Optional[str] = None
