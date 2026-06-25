from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date


class TodayStats(BaseModel):
    date: date
    habits_total: int
    habits_completed: int
    habits_completion_rate: float
    tasks_total: int
    tasks_completed: int
    tasks_today: int
    latest_weight: Optional[float] = None
    water_ml: Optional[int] = None
    sleep_hours: Optional[float] = None
    energy_level: Optional[int] = None


class FinancialStats(BaseModel):
    income_month: float
    expenses_month: float
    savings_month: float
    spent_today: float


class GoalStats(BaseModel):
    total: int
    completed: int
    in_progress: int
    completion_rate: float


class WeeklyScore(BaseModel):
    score: float
    habits_score: float
    tasks_score: float
    goals_score: float
    health_score: float


class DashboardResponse(BaseModel):
    today: TodayStats
    financial: FinancialStats
    goals: GoalStats
    weekly_score: WeeklyScore
    current_streaks: List[Dict[str, Any]] = []
    weight_chart: List[Dict[str, Any]] = []
    habits_heatmap: Dict[str, Any] = {}
    recent_transactions: List[Dict[str, Any]] = []
    upcoming_tasks: List[Dict[str, Any]] = []
    goals_progress: List[Dict[str, Any]] = []
