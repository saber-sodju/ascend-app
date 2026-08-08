from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.habit import Habit
from app.models.goal import Goal, GoalStatus
from app.models.achievement import UserAchievement
from app.models.user import User
from app.schemas.gamification import StatsResponse, HabitStatSummary
from app.routers.deps import get_current_user
from app.utils.streaks import calculate_streak
from app.gamification.catalog import ACHIEVEMENTS
from app.gamification.engine import evaluate_achievements
from app.gamification.leveling import level_from_xp

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()

    summaries: list[HabitStatSummary] = []
    best_current_streak = 0
    best_longest_streak = 0
    for h in habits:
        total = len(h.logs)
        if total == 0:
            continue
        completed = len([l for l in h.logs if l.completed])
        rate = round(completed / total * 100, 1)
        current, longest = calculate_streak(h.logs)
        best_current_streak = max(best_current_streak, current)
        best_longest_streak = max(best_longest_streak, longest)
        summaries.append(HabitStatSummary(habit_id=str(h.id), title=h.title, icon=h.icon, completion_rate=rate, current_streak=current))

    ranked = sorted(summaries, key=lambda s: s.completion_rate, reverse=True)
    best_habits = ranked[:3]
    worst_habits = list(reversed(ranked[-3:])) if ranked else []
    average_completion_rate = round(sum(s.completion_rate for s in summaries) / len(summaries), 1) if summaries else 0.0

    evaluate_achievements(db, current_user)
    unlocked_count = db.query(UserAchievement).filter(
        UserAchievement.user_id == current_user.id, UserAchievement.unlocked_at != None
    ).count()

    goals_completed = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == GoalStatus.completed).count()

    return StatsResponse(
        best_habits=best_habits,
        worst_habits=worst_habits,
        average_completion_rate=average_completion_rate,
        best_current_streak=best_current_streak,
        best_longest_streak=best_longest_streak,
        achievements_unlocked=unlocked_count,
        achievements_total=len(ACHIEVEMENTS),
        goals_completed=goals_completed,
        xp=current_user.xp or 0,
        level_info=level_from_xp(current_user.xp or 0),
    )
