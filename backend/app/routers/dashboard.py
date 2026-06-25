from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models.user import User
from app.models.goal import Goal, GoalStatus
from app.models.habit import Habit, HabitLog
from app.models.task import Task, TaskStatus
from app.models.finance import Transaction, TransactionType
from app.models.health import WeightLog, HealthLog
from app.schemas.dashboard import DashboardResponse, TodayStats, FinancialStats, GoalStats, WeeklyScore
from app.routers.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    month_start = today.replace(day=1)
    week_ago = today - timedelta(days=7)

    habits = db.query(Habit).filter(Habit.user_id == current_user.id, Habit.is_active == True).all()
    today_logs = db.query(HabitLog).filter(
        HabitLog.habit_id.in_([h.id for h in habits]),
        HabitLog.date == today,
        HabitLog.completed == True
    ).all()
    habits_completed = len(today_logs)
    habits_total = len(habits)

    tasks_today = db.query(Task).filter(Task.user_id == current_user.id, Task.due_date == today).all()
    tasks_completed = len([t for t in tasks_today if t.status == TaskStatus.completed])

    latest_weight = db.query(WeightLog).filter(WeightLog.user_id == current_user.id).order_by(WeightLog.date.desc()).first()
    today_health = db.query(HealthLog).filter(HealthLog.user_id == current_user.id, HealthLog.date == today).first()

    today_stats = TodayStats(
        date=today,
        habits_total=habits_total,
        habits_completed=habits_completed,
        habits_completion_rate=round(habits_completed / habits_total * 100, 1) if habits_total else 0,
        tasks_total=len(tasks_today),
        tasks_completed=tasks_completed,
        tasks_today=len([t for t in tasks_today if t.status != TaskStatus.completed]),
        latest_weight=latest_weight.weight if latest_weight else None,
        water_ml=today_health.water_ml if today_health else None,
        sleep_hours=today_health.sleep_hours if today_health else None,
        energy_level=today_health.energy_level if today_health else None,
    )

    month_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month_start
    ).all()
    income = sum(t.amount for t in month_txs if t.type == TransactionType.income)
    expenses = sum(t.amount for t in month_txs if t.type == TransactionType.expense)
    today_expenses = sum(t.amount for t in month_txs if t.type == TransactionType.expense and t.date == today)
    financial = FinancialStats(income_month=income, expenses_month=expenses, savings_month=income - expenses, spent_today=today_expenses)

    all_goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    completed_goals = len([g for g in all_goals if g.status == GoalStatus.completed])
    in_progress_goals = len([g for g in all_goals if g.status == GoalStatus.in_progress])
    goal_stats = GoalStats(
        total=len(all_goals),
        completed=completed_goals,
        in_progress=in_progress_goals,
        completion_rate=round(completed_goals / len(all_goals) * 100, 1) if all_goals else 0
    )

    week_habit_logs = db.query(HabitLog).filter(
        HabitLog.habit_id.in_([h.id for h in habits]),
        HabitLog.date >= week_ago
    ).all()
    expected_week = habits_total * 7
    habit_score = min(100, round(len([l for l in week_habit_logs if l.completed]) / expected_week * 100, 1)) if expected_week else 0
    week_tasks = db.query(Task).filter(Task.user_id == current_user.id, Task.due_date >= week_ago, Task.due_date <= today).all()
    task_score = round(len([t for t in week_tasks if t.status == TaskStatus.completed]) / len(week_tasks) * 100, 1) if week_tasks else 0
    goal_score = goal_stats.completion_rate
    health_score = min(100, (today_stats.habits_completion_rate + (70 if today_stats.sleep_hours and today_stats.sleep_hours >= 7 else 30)) / 2)
    weekly_score = WeeklyScore(
        score=round((habit_score + task_score + goal_score + health_score) / 4, 1),
        habits_score=habit_score,
        tasks_score=task_score,
        goals_score=goal_score,
        health_score=health_score
    )

    streaks = []
    for h in sorted(habits, key=lambda x: x.title)[:5]:
        logs = sorted([l for l in h.logs if l.completed], key=lambda x: x.date, reverse=True)
        streak = 0
        check = today
        for log in logs:
            if log.date == check or log.date == check - timedelta(days=1):
                streak += 1
                check = log.date - timedelta(days=1)
            else:
                break
        streaks.append({"id": str(h.id), "title": h.title, "icon": h.icon, "color": h.color, "streak": streak})

    weight_logs = db.query(WeightLog).filter(WeightLog.user_id == current_user.id).order_by(WeightLog.date.desc()).limit(30).all()
    weight_chart = [{"date": str(w.date), "weight": w.weight} for w in reversed(weight_logs)]

    recent_txs = sorted(month_txs, key=lambda x: x.date, reverse=True)[:5]
    recent_transactions = [{"id": str(t.id), "type": t.type.value, "category": t.category, "amount": t.amount, "date": str(t.date), "description": t.description} for t in recent_txs]

    upcoming = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status != TaskStatus.completed,
        Task.due_date >= today
    ).order_by(Task.due_date).limit(5).all()
    upcoming_tasks = [{"id": str(t.id), "title": t.title, "due_date": str(t.due_date) if t.due_date else None, "priority": t.priority.value, "status": t.status.value} for t in upcoming]

    goals_progress = []
    for g in sorted(all_goals, key=lambda x: x.created_at, reverse=True)[:6]:
        progress = 0
        if g.target_value and g.target_value > 0:
            progress = min(100, round(g.current_value / g.target_value * 100, 1))
        goals_progress.append({"id": str(g.id), "title": g.title, "category": g.category.value, "progress": progress, "color": g.color, "emoji": g.emoji, "status": g.status.value, "deadline": str(g.deadline) if g.deadline else None})

    return DashboardResponse(
        today=today_stats,
        financial=financial,
        goals=goal_stats,
        weekly_score=weekly_score,
        current_streaks=streaks,
        weight_chart=weight_chart,
        recent_transactions=recent_transactions,
        upcoming_tasks=upcoming_tasks,
        goals_progress=goals_progress
    )
