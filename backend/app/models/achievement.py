from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base
from app.utils.guid import GUID


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    achievement_key = Column(String(100), nullable=False)
    progress_current = Column(Float, default=0)
    progress_target = Column(Float, default=1)
    unlocked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="achievements")
