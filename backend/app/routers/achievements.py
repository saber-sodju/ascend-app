from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.achievement import AchievementResponse
from app.routers.deps import get_current_user
from app.gamification.engine import get_achievements_overview

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=List[AchievementResponse])
def list_achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_achievements_overview(db, current_user)
