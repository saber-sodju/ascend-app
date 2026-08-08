from pydantic import BaseModel
from typing import List
from app.schemas.achievement import LevelInfoResponse


class HabitStatSummary(BaseModel):
    habit_id: str
    title: str
    icon: str
    completion_rate: float
    current_streak: int


class StatsResponse(BaseModel):
    best_habits: List[HabitStatSummary]
    worst_habits: List[HabitStatSummary]
    average_completion_rate: float
    best_current_streak: int
    best_longest_streak: int
    achievements_unlocked: int
    achievements_total: int
    goals_completed: int
    xp: int
    level_info: LevelInfoResponse
