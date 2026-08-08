from datetime import date, timedelta
from typing import Callable, Dict
from sqlalchemy.orm import Session
from app.models.habit import Habit, HabitLog, HabitFrequency
from app.models.health import ActivityLog
from app.models.reading import Book, BookStatus
from app.models.goal import Goal, GoalStatus
from app.models.user import User
from app.utils.streaks import calculate_streak

MetricFn = Callable[[Session, User], float]


def max_habit_streak(db: Session, user: User) -> float:
    habits = db.query(Habit).filter(Habit.user_id == user.id, Habit.is_active == True).all()
    best = 0
    for h in habits:
        current, _ = calculate_streak(h.logs)
        best = max(best, current)
    return best


def total_activity_logs(db: Session, user: User) -> float:
    return db.query(ActivityLog).filter(ActivityLog.user_id == user.id).count()


def total_books_finished(db: Session, user: User) -> float:
    return db.query(Book).filter(Book.user_id == user.id, Book.status == BookStatus.completed).count()


def perfect_days_streak(db: Session, user: User) -> float:
    """Consecutive days (ending today or yesterday) where every active daily habit was completed.
    Weekly/monthly habits have no due-day modeled yet, so they're excluded from this check
    rather than guessing a schedule for them."""
    habits = db.query(Habit).filter(
        Habit.user_id == user.id, Habit.is_active == True, Habit.frequency == HabitFrequency.daily
    ).all()
    if not habits:
        return 0
    habit_ids = [h.id for h in habits]
    logs = db.query(HabitLog).filter(HabitLog.habit_id.in_(habit_ids), HabitLog.completed == True).all()
    completed_by_date: dict[date, set] = {}
    for log in logs:
        completed_by_date.setdefault(log.date, set()).add(log.habit_id)

    check = date.today()
    if not all(h.id in completed_by_date.get(check, set()) for h in habits):
        # Today isn't finished yet — start counting from yesterday instead of breaking the streak.
        check -= timedelta(days=1)

    streak = 0
    while all(h.id in completed_by_date.get(check, set()) for h in habits):
        streak += 1
        check -= timedelta(days=1)
    return streak


def completed_goals_count(db: Session, user: User) -> float:
    return db.query(Goal).filter(Goal.user_id == user.id, Goal.status == GoalStatus.completed).count()


def goals_completed_this_month(db: Session, user: User) -> float:
    today = date.today()
    month_goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.deadline != None,
        Goal.deadline >= date(today.year, today.month, 1),
        Goal.deadline <= today.replace(day=28) + timedelta(days=4),
    ).all()
    month_goals = [g for g in month_goals if g.deadline.month == today.month and g.deadline.year == today.year]
    if not month_goals:
        return 0
    return 1 if all(g.status == GoalStatus.completed for g in month_goals) else 0


METRIC_REGISTRY: Dict[str, MetricFn] = {
    "max_habit_streak": max_habit_streak,
    "total_activity_logs": total_activity_logs,
    "total_books_finished": total_books_finished,
    "perfect_days_streak": perfect_days_streak,
    "completed_goals_count": completed_goals_count,
    "goals_completed_this_month": goals_completed_this_month,
}
