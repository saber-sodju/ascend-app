from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Integer, Text, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base
from app.utils.guid import GUID


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SAEnum(TaskPriority), default=TaskPriority.medium)
    category = Column(String(100), nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(SAEnum(TaskStatus), default=TaskStatus.todo)
    order = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="tasks")
