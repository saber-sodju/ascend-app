from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models.user import User
from app.models.habit import Habit, HabitLog
from app.models.goal import Goal
from app.models.finance import Transaction, TransactionType
from app.models.health import WeightLog, HealthLog
from app.models.journal import JournalEntry
from app.routers.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/productivity")
def get_productivity_analytics(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    start = today - timedelta(days=days)
    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    result = []
    for i in range(days):
        d = start + timedelta(days=i)
        logs = db.query(HabitLog).filter(
            HabitLog.habit_id.in_([h.id for h in habits]),
            HabitLog.date == d,
            HabitLog.completed == True
        ).count()
        journal = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id, JournalEntry.date == d).first()
        score = round(logs / len(habits) * 100, 1) if habits else 0
        result.append({
            "date": str(d),
            "habits_score": score,
            "mood": journal.mood if journal else None,
            "productivity": journal.productivity if journal else None,
            "energy": journal.energy if journal else None,
        })
    return result


@router.get("/habits")
def get_habits_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    result = []
    today = date.today()
    for h in habits:
        total = len(h.logs)
        completed = len([l for l in h.logs if l.completed])
        rate = round(completed / total * 100, 1) if total else 0
        logs_sorted = sorted([l for l in h.logs if l.completed], key=lambda x: x.date, reverse=True)
        streak = 0
        check = today
        for log in logs_sorted:
            if log.date == check or log.date == check - timedelta(days=1):
                streak += 1
                check = log.date - timedelta(days=1)
            else:
                break
        result.append({"id": str(h.id), "title": h.title, "icon": h.icon, "color": h.color, "total_logs": total, "completed": completed, "rate": rate, "streak": streak, "is_active": h.is_active})
    return result


@router.get("/finance")
def get_finance_analytics(year: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    y = year or today.year
    import calendar
    monthly = []
    for m in range(1, 13):
        _, last = calendar.monthrange(y, m)
        start_m, end_m = date(y, m, 1), date(y, m, last)
        txs = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= start_m,
            Transaction.date <= end_m
        ).all()
        income = sum(t.amount for t in txs if t.type == TransactionType.income)
        expense = sum(t.amount for t in txs if t.type == TransactionType.expense)
        monthly.append({"month": m, "income": income, "expense": expense, "savings": income - expense})

    all_txs = db.query(Transaction).filter(Transaction.user_id == current_user.id, Transaction.type == TransactionType.expense).all()
    by_cat: dict = {}
    for t in all_txs:
        by_cat[t.category] = by_cat.get(t.category, 0) + t.amount

    return {"monthly": monthly, "by_category": by_cat, "year": y}


@router.get("/health")
def get_health_analytics(days: int = 90, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    start = today - timedelta(days=days)
    weights = db.query(WeightLog).filter(WeightLog.user_id == current_user.id, WeightLog.date >= start).order_by(WeightLog.date).all()
    health_logs = db.query(HealthLog).filter(HealthLog.user_id == current_user.id, HealthLog.date >= start).order_by(HealthLog.date).all()
    return {
        "weight_chart": [{"date": str(w.date), "weight": w.weight} for w in weights],
        "sleep_chart": [{"date": str(l.date), "sleep": l.sleep_hours} for l in health_logs if l.sleep_hours],
        "water_chart": [{"date": str(l.date), "water": l.water_ml} for l in health_logs if l.water_ml],
        "energy_chart": [{"date": str(l.date), "energy": l.energy_level} for l in health_logs if l.energy_level],
    }


@router.get("/goals")
def get_goals_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    by_category: dict = {}
    by_status: dict = {}
    for g in goals:
        by_category[g.category.value] = by_category.get(g.category.value, 0) + 1
        by_status[g.status.value] = by_status.get(g.status.value, 0) + 1
    return {
        "total": len(goals),
        "by_category": by_category,
        "by_status": by_status,
        "goals": [{"id": str(g.id), "title": g.title, "category": g.category.value, "status": g.status.value, "progress": round(g.current_value / g.target_value * 100, 1) if g.target_value else 0, "deadline": str(g.deadline) if g.deadline else None}]
    }
