from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.health import WeightLog, BodyMeasurement, ActivityLog, HealthLog
from app.models.user import User
from app.schemas.health import (
    WeightLogCreate, WeightLogResponse,
    BodyMeasurementCreate, BodyMeasurementResponse,
    ActivityLogCreate, ActivityLogResponse,
    HealthLogCreate, HealthLogUpdate, HealthLogResponse,
    HealthSummary
)
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/weight", response_model=List[WeightLogResponse])
def list_weight_logs(
    limit: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(WeightLog).filter(WeightLog.user_id == current_user.id).order_by(WeightLog.date.desc()).limit(limit).all()


@router.post("/weight", response_model=WeightLogResponse)
def create_weight_log(data: WeightLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = WeightLog(user_id=current_user.id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/weight/{log_id}")
def delete_weight_log(log_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(WeightLog).filter(WeightLog.id == log_id, WeightLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(log)
    db.commit()
    return {"message": "Удалено"}


@router.get("/measurements", response_model=List[BodyMeasurementResponse])
def list_measurements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(BodyMeasurement).filter(BodyMeasurement.user_id == current_user.id).order_by(BodyMeasurement.date.desc()).all()


@router.post("/measurements", response_model=BodyMeasurementResponse)
def create_measurement(data: BodyMeasurementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = BodyMeasurement(user_id=current_user.id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/activities", response_model=List[ActivityLogResponse])
def list_activities(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).order_by(ActivityLog.date.desc()).limit(limit).all()


@router.post("/activities", response_model=ActivityLogResponse)
def create_activity(data: ActivityLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = ActivityLog(user_id=current_user.id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.delete("/activities/{log_id}")
def delete_activity(log_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(ActivityLog).filter(ActivityLog.id == log_id, ActivityLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(log)
    db.commit()
    return {"message": "Удалено"}


@router.get("/logs", response_model=List[HealthLogResponse])
def list_health_logs(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(HealthLog).filter(HealthLog.user_id == current_user.id).order_by(HealthLog.date.desc()).limit(limit).all()


@router.get("/logs/today", response_model=Optional[HealthLogResponse])
def get_today_health_log(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(HealthLog).filter(HealthLog.user_id == current_user.id, HealthLog.date == date.today()).first()


@router.post("/logs", response_model=HealthLogResponse)
def upsert_health_log(data: HealthLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(HealthLog).filter(HealthLog.user_id == current_user.id, HealthLog.date == data.date).first()
    if existing:
        for field, value in data.model_dump(exclude_none=True).items():
            if field != "date":
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    log = HealthLog(user_id=current_user.id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/summary", response_model=HealthSummary)
def get_health_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    latest_weight = db.query(WeightLog).filter(WeightLog.user_id == current_user.id).order_by(WeightLog.date.desc()).first()
    week_ago = date.today() - timedelta(days=7)
    week_weights = db.query(WeightLog).filter(WeightLog.user_id == current_user.id, WeightLog.date >= week_ago).all()
    avg_w = sum(w.weight for w in week_weights) / len(week_weights) if week_weights else None
    logs_7d = db.query(HealthLog).filter(HealthLog.user_id == current_user.id, HealthLog.date >= week_ago).all()
    sleep_vals = [l.sleep_hours for l in logs_7d if l.sleep_hours]
    water_vals = [l.water_ml for l in logs_7d if l.water_ml]
    energy_vals = [l.energy_level for l in logs_7d if l.energy_level]
    return HealthSummary(
        latest_weight=latest_weight.weight if latest_weight else None,
        avg_weight_week=round(avg_w, 1) if avg_w else None,
        target_weight=float(current_user.target_weight) if current_user.target_weight else None,
        avg_sleep=round(sum(sleep_vals) / len(sleep_vals), 1) if sleep_vals else None,
        avg_water=int(sum(water_vals) / len(water_vals)) if water_vals else None,
        avg_energy=round(sum(energy_vals) / len(energy_vals), 1) if energy_vals else None,
    )
