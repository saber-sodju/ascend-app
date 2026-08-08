from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import List, Optional
from app.models.goal import Goal

ROLLING_WINDOW_DAYS = 30


@dataclass
class HabitInfluence:
    habit_id: str
    title: str
    icon: str
    weight: float
    completion_rate_percent: float
    done_today: bool


@dataclass
class GoalProgressInfo:
    percent: float
    habits: List[HabitInfluence] = field(default_factory=list)
    forecast_date: Optional[date] = None


def _habit_completion_rate(habit) -> tuple[float, bool]:
    today = date.today()
    start = today - timedelta(days=ROLLING_WINDOW_DAYS - 1)
    logs_in_window = [l for l in habit.logs if start <= l.date <= today and l.completed]
    rate = round(len(logs_in_window) / ROLLING_WINDOW_DAYS * 100, 1)
    done_today = any(l.date == today and l.completed for l in habit.logs)
    return rate, done_today


def _forecast(percent: float, start: date) -> Optional[date]:
    if percent >= 100:
        return date.today()
    days_elapsed = max(1, (date.today() - start).days)
    daily_rate = percent / days_elapsed
    if daily_rate <= 0:
        return None
    days_needed = (100 - percent) / daily_rate
    return date.today() + timedelta(days=round(days_needed))


def compute_goal_progress(goal: Goal) -> GoalProgressInfo:
    habits_info = []
    for link in goal.habit_links:
        rate_percent, done_today = _habit_completion_rate(link.habit)
        habits_info.append(HabitInfluence(
            habit_id=str(link.habit_id),
            title=link.habit.title,
            icon=link.habit.icon,
            weight=link.impact_weight if link.impact_weight is not None else link.habit.weight,
            completion_rate_percent=rate_percent,
            done_today=done_today,
        ))

    if goal.target_value and goal.target_value > 0:
        # Metric-driven goal (e.g. numeric target like weight) — progress comes from
        # current_value/target_value as before; linked habits are shown as context only.
        percent = min(100.0, round((goal.current_value / goal.target_value) * 100, 1))
    elif habits_info:
        total_weight = sum(h.weight for h in habits_info)
        percent = round(sum(h.weight * h.completion_rate_percent for h in habits_info) / total_weight, 1) if total_weight else 0.0
    elif goal.sub_goals:
        percent = round(sum(1 for s in goal.sub_goals if s.is_completed) / len(goal.sub_goals) * 100, 1)
    else:
        percent = 0.0

    start = goal.start_date or (goal.created_at.date() if goal.created_at else date.today())
    forecast_date = _forecast(percent, start) if goal.deadline is None or goal.deadline >= date.today() else None

    return GoalProgressInfo(percent=percent, habits=habits_info, forecast_date=forecast_date)
