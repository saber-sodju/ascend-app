from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AchievementResponse(BaseModel):
    key: str
    name: str
    description: str
    icon: str
    rarity: str
    category: str
    progress_current: float
    progress_target: float
    unlocked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UnlockedAchievementResponse(BaseModel):
    key: str
    name: str
    description: str
    icon: str
    rarity: str
    xp_bonus: int

    class Config:
        from_attributes = True


class LevelInfoResponse(BaseModel):
    level: int
    xp: int
    floor_xp: int
    next_level_xp: int
    progress_percent: float

    class Config:
        from_attributes = True
