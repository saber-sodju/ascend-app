from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.goal import GoalCategory, GoalPriority, GoalStatus
import uuid


class SubGoalBase(BaseModel):
    title: str
    is_completed: bool = False
    order: int = 0


class SubGoalCreate(SubGoalBase):
    pass


class SubGoalUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    order: Optional[int] = None


class SubGoalResponse(SubGoalBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class MilestoneBase(BaseModel):
    title: str
    target_value: Optional[float] = None


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneResponse(MilestoneBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    achieved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: GoalCategory = GoalCategory.other
    priority: GoalPriority = GoalPriority.medium
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    current_value: float = 0
    target_value: Optional[float] = None
    unit: Optional[str] = None
    color: str = "#6366f1"
    emoji: Optional[str] = None


class GoalCreate(GoalBase):
    sub_goals: List[SubGoalCreate] = []


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[GoalCategory] = None
    priority: Optional[GoalPriority] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[GoalStatus] = None
    color: Optional[str] = None
    emoji: Optional[str] = None


class GoalResponse(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: GoalStatus
    progress_percent: float = 0
    sub_goals: List[SubGoalResponse] = []
    milestones: List[MilestoneResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
