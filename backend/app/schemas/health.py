from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import uuid


class WeightLogBase(BaseModel):
    weight: float
    date: date
    notes: Optional[str] = None


class WeightLogCreate(WeightLogBase):
    pass


class WeightLogResponse(WeightLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BodyMeasurementBase(BaseModel):
    date: date
    waist: Optional[float] = None
    chest: Optional[float] = None
    arms: Optional[float] = None
    legs: Optional[float] = None


class BodyMeasurementCreate(BodyMeasurementBase):
    pass


class BodyMeasurementResponse(BodyMeasurementBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogBase(BaseModel):
    type: str
    date: date
    duration: Optional[int] = None
    distance: Optional[float] = None
    calories: Optional[int] = None
    notes: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class HealthLogBase(BaseModel):
    date: date
    sleep_hours: Optional[float] = None
    water_ml: Optional[int] = None
    energy_level: Optional[int] = None


class HealthLogCreate(HealthLogBase):
    pass


class HealthLogUpdate(BaseModel):
    sleep_hours: Optional[float] = None
    water_ml: Optional[int] = None
    energy_level: Optional[int] = None


class HealthLogResponse(HealthLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class HealthSummary(BaseModel):
    latest_weight: Optional[float] = None
    avg_weight_week: Optional[float] = None
    target_weight: Optional[float] = None
    avg_sleep: Optional[float] = None
    avg_water: Optional[int] = None
    avg_energy: Optional[float] = None
