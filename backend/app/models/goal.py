from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Integer, Boolean, Text, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base
from app.utils.guid import GUID


class GoalCategory(str, enum.Enum):
    health = "health"
    education = "education"
    career = "career"
    finance = "finance"
    family = "family"
    religion = "religion"
    self_development = "self_development"
    other = "other"


class GoalPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class GoalStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    paused = "paused"
    cancelled = "cancelled"


class Goal(Base):
    __tablename__ = "goals"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SAEnum(GoalCategory), default=GoalCategory.other)
    priority = Column(SAEnum(GoalPriority), default=GoalPriority.medium)
    start_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=True)
    current_value = Column(Float, default=0)
    target_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    status = Column(SAEnum(GoalStatus), default=GoalStatus.not_started)
    color = Column(String(7), default="#6366f1")
    emoji = Column(String(10), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="goals")
    sub_goals = relationship("SubGoal", back_populates="goal", cascade="all, delete-orphan")
    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")


class SubGoal(Base):
    __tablename__ = "sub_goals"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    goal_id = Column(GUID(), ForeignKey("goals.id"), nullable=False)
    title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    goal = relationship("Goal", back_populates="sub_goals")


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    goal_id = Column(GUID(), ForeignKey("goals.id"), nullable=False)
    title = Column(String(255), nullable=False)
    target_value = Column(Float, nullable=True)
    achieved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    goal = relationship("Goal", back_populates="milestones")
