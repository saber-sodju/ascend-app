from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.task import TaskPriority, TaskStatus
import uuid


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.medium
    category: Optional[str] = None
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    order: Optional[int] = None


class TaskResponse(TaskBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: TaskStatus
    order: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskReorderRequest(BaseModel):
    task_ids: list[uuid.UUID]
