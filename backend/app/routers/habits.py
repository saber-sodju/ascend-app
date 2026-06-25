from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.habit import Habit, HabitLog
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse, HabitLogResponse, HabitToggleRequest
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/habits", tags=["habits"])


def calculate_streak(logs: List[HabitLog]) -> tuple[int, int]:
    if not logs:
        return 0, 0
    sorted_logs = sorted([l for l in logs if l.completed], key=lambda x: x.date, reverse=True)
    if not sorted_logs:
        return 0, 0
    current = 0
    today = date.today()
    check = today
    for log in sorted_logs:
        if log.date == check or log.date == check - timedelta(days=1):
            current += 1
            check = log.date - timedelta(days=1)
        else:
            break
    longest = 0
    current_run = 1
    for i in range(1, len(sorted_logs)):
        if (sorted_logs[i - 1].date - sorted_logs[i].date).days == 1:
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1
    longest = max(longest, current_run)
    return current, longest


def habit_to_response(habit: Habit) -> HabitResponse:
    streak, longest = calculate_streak(habit.logs)
    last_30 = [l for l in habit.logs if l.date >= date.today() - timedelta(days=30)]
    rate = round(len([l for l in last_30 if l.completed]) / 30 * 100, 1) if last_30 else 0
    data = HabitResponse.model_validate(habit)
    data.current_streak = streak
    data.longest_streak = longest
    data.completion_rate = rate
    return data


@router.get("", response_model=List[HabitResponse])
def list_habits(active_only: bool = True, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Habit).filter(Habit.user_id == current_user.id)
    if active_only:
        q = q.filter(Habit.is_active == True)
    return [habit_to_response(h) for h in q.all()]


@router.post("", response_model=HabitResponse)
def create_habit(data: HabitCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = Habit(user_id=current_user.id, **data.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit_to_response(habit)


@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(habit_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена")
    return habit_to_response(habit)


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: uuid.UUID, data: HabitUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(habit, field, value)
    db.commit()
    db.refresh(habit)
    return habit_to_response(habit)


@router.delete("/{habit_id}")
def delete_habit(habit_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена")
    db.delete(habit)
    db.commit()
    return {"message": "Привычка удалена"}


@router.post("/{habit_id}/toggle", response_model=HabitLogResponse)
def toggle_habit(habit_id: uuid.UUID, data: HabitToggleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена")
    existing = db.query(HabitLog).filter(HabitLog.habit_id == habit_id, HabitLog.date == data.date).first()
    if existing:
        existing.completed = data.completed
        existing.value = data.value
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        return existing
    log = HabitLog(habit_id=habit_id, date=data.date, completed=data.completed, value=data.value, notes=data.notes)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{habit_id}/logs", response_model=List[HabitLogResponse])
def get_habit_logs(
    habit_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена")
    q = db.query(HabitLog).filter(HabitLog.habit_id == habit_id)
    if start_date:
        q = q.filter(HabitLog.date >= start_date)
    if end_date:
        q = q.filter(HabitLog.date <= end_date)
    return q.order_by(HabitLog.date.desc()).all()


@router.get("/heatmap/all")
def get_habits_heatmap(
    year: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import date as dt
    if not year:
        year = dt.today().year
    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    result = {}
    for habit in habits:
        logs = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date >= dt(year, 1, 1),
            HabitLog.date <= dt(year, 12, 31)
        ).all()
        result[str(habit.id)] = {
            "title": habit.title,
            "color": habit.color,
            "logs": {str(l.date): l.completed for l in logs}
        }
    return result
