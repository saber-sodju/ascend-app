from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta, datetime
from app.database import get_db
from app.models.user import User
from app.models.goal import Goal, GoalStatus
from app.models.habit import Habit, HabitLog
from app.models.task import Task, TaskStatus
from app.models.finance import Transaction, TransactionType
from app.models.health import WeightLog, HealthLog
from app.models.journal import JournalEntry
from app.routers.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/weekly")
def get_weekly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    habit_logs = db.query(HabitLog).filter(
        HabitLog.habit_id.in_([h.id for h in habits]),
        HabitLog.date >= week_start,
        HabitLog.date <= week_end
    ).all()
    expected = len(habits) * 7
    completed_habit_logs = [l for l in habit_logs if l.completed]
    habits_score = round(len(completed_habit_logs) / expected * 100, 1) if expected else 0

    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.due_date >= week_start,
        Task.due_date <= week_end
    ).all()
    completed_tasks = [t for t in tasks if t.status == TaskStatus.completed]
    tasks_score = round(len(completed_tasks) / len(tasks) * 100, 1) if tasks else 0

    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    completed_goals = [g for g in goals if g.status == GoalStatus.completed]
    goals_score = round(len(completed_goals) / len(goals) * 100, 1) if goals else 0

    txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= week_start,
        Transaction.date <= week_end
    ).all()
    income = sum(t.amount for t in txs if t.type == TransactionType.income)
    expenses = sum(t.amount for t in txs if t.type == TransactionType.expense)

    weights = db.query(WeightLog).filter(
        WeightLog.user_id == current_user.id,
        WeightLog.date >= week_start
    ).order_by(WeightLog.date).all()
    weight_change = None
    if len(weights) >= 2:
        weight_change = round(weights[-1].weight - weights[0].weight, 1)

    health_logs = db.query(HealthLog).filter(
        HealthLog.user_id == current_user.id,
        HealthLog.date >= week_start
    ).all()
    avg_sleep = round(sum(l.sleep_hours for l in health_logs if l.sleep_hours) / len([l for l in health_logs if l.sleep_hours]), 1) if any(l.sleep_hours for l in health_logs) else None
    avg_energy = round(sum(l.energy_level for l in health_logs if l.energy_level) / len([l for l in health_logs if l.energy_level]), 1) if any(l.energy_level for l in health_logs) else None

    weekly_score = round((habits_score + tasks_score + goals_score) / 3, 1)

    habit_details = []
    for h in habits:
        h_logs = [l for l in completed_habit_logs if l.habit_id == h.id]
        habit_details.append({"id": str(h.id), "title": h.title, "icon": h.icon, "color": h.color, "completed": len(h_logs), "target": 7, "rate": round(len(h_logs) / 7 * 100, 1)})

    return {
        "week_start": str(week_start),
        "week_end": str(week_end),
        "weekly_score": weekly_score,
        "habits": {"score": habits_score, "completed": len(completed_habit_logs), "total": expected, "details": habit_details},
        "tasks": {"score": tasks_score, "completed": len(completed_tasks), "total": len(tasks), "list": [{"title": t.title, "priority": t.priority.value} for t in completed_tasks]},
        "goals": {"score": goals_score, "completed": len(completed_goals), "total": len(goals), "in_progress": [{"title": g.title, "progress": round(g.current_value / g.target_value * 100, 1) if g.target_value else 0} for g in goals if g.status == GoalStatus.in_progress]},
        "finance": {"income": income, "expenses": expenses, "savings": income - expenses},
        "health": {"weight_change": weight_change, "avg_sleep": avg_sleep, "avg_energy": avg_energy},
    }


@router.get("/monthly")
def get_monthly_report(month: int = None, year: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    m = month or today.month
    y = year or today.year
    month_start = date(y, m, 1)
    import calendar
    last_day = calendar.monthrange(y, m)[1]
    month_end = date(y, m, last_day)

    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    habit_logs = db.query(HabitLog).filter(
        HabitLog.habit_id.in_([h.id for h in habits]),
        HabitLog.date >= month_start,
        HabitLog.date <= month_end,
        HabitLog.completed == True
    ).all()
    expected = len(habits) * last_day
    habits_score = round(len(habit_logs) / expected * 100, 1) if expected else 0

    tasks = db.query(Task).filter(Task.user_id == current_user.id, Task.due_date >= month_start, Task.due_date <= month_end).all()
    completed_tasks = [t for t in tasks if t.status == TaskStatus.completed]
    tasks_score = round(len(completed_tasks) / len(tasks) * 100, 1) if tasks else 0

    txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month_start,
        Transaction.date <= month_end
    ).all()
    income = sum(t.amount for t in txs if t.type == TransactionType.income)
    expenses = sum(t.amount for t in txs if t.type == TransactionType.expense)
    by_category: dict = {}
    for t in txs:
        if t.type == TransactionType.expense:
            by_category[t.category] = by_category.get(t.category, 0) + t.amount

    weights = db.query(WeightLog).filter(WeightLog.user_id == current_user.id, WeightLog.date >= month_start, WeightLog.date <= month_end).order_by(WeightLog.date).all()
    weight_chart = [{"date": str(w.date), "weight": w.weight} for w in weights]
    weight_change = round(weights[-1].weight - weights[0].weight, 1) if len(weights) >= 2 else None

    journals = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id, JournalEntry.date >= month_start, JournalEntry.date <= month_end).all()
    avg_mood = round(sum(j.mood for j in journals if j.mood) / len([j for j in journals if j.mood]), 1) if any(j.mood for j in journals) else None
    avg_productivity = round(sum(j.productivity for j in journals if j.productivity) / len([j for j in journals if j.productivity]), 1) if any(j.productivity for j in journals) else None

    monthly_score = round((habits_score + tasks_score) / 2, 1)

    return {
        "month": m,
        "year": y,
        "monthly_score": monthly_score,
        "habits": {"score": habits_score, "completed": len(habit_logs), "total": expected},
        "tasks": {"score": tasks_score, "completed": len(completed_tasks), "total": len(tasks)},
        "finance": {"income": income, "expenses": expenses, "savings": income - expenses, "by_category": by_category},
        "health": {"weight_change": weight_change, "weight_chart": weight_chart},
        "journal": {"entries_count": len(journals), "avg_mood": avg_mood, "avg_productivity": avg_productivity},
    }
