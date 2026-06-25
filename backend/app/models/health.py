from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base
from app.utils.guid import GUID


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    weight = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="weight_logs")


class BodyMeasurement(Base):
    __tablename__ = "body_measurements"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    waist = Column(Float, nullable=True)
    chest = Column(Float, nullable=True)
    arms = Column(Float, nullable=True)
    legs = Column(Float, nullable=True)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="body_measurements")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    type = Column(String(100), nullable=False)
    duration = Column(Integer, nullable=True)
    distance = Column(Float, nullable=True)
    calories = Column(Integer, nullable=True)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activity_logs")


class HealthLog(Base):
    __tablename__ = "health_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    sleep_hours = Column(Float, nullable=True)
    water_ml = Column(Integer, nullable=True)
    energy_level = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="health_logs")
