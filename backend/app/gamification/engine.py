from dataclasses import dataclass
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.achievement import UserAchievement
from app.gamification.catalog import ACHIEVEMENTS
from app.gamification.metrics import METRIC_REGISTRY
from app.gamification.rarity import RARITY_XP_BONUS


@dataclass
class UnlockedAchievement:
    key: str
    name: str
    description: str
    icon: str
    rarity: str
    xp_bonus: int


def evaluate_achievements(db: Session, user: User) -> List[UnlockedAchievement]:
    """Recomputes progress for every catalog entry and unlocks any that just crossed
    their threshold, awarding XP for each. Cheap enough to call on every relevant
    write (habit toggle, activity log, book finished, goal completed) given the
    personal-scale data volume this app deals with — no caching needed."""
    metric_cache: dict[str, float] = {}
    existing = {
        ua.achievement_key: ua
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }
    newly_unlocked: List[UnlockedAchievement] = []

    for definition in ACHIEVEMENTS:
        if definition.metric_key not in metric_cache:
            metric_cache[definition.metric_key] = METRIC_REGISTRY[definition.metric_key](db, user)
        current_value = metric_cache[definition.metric_key]

        record = existing.get(definition.key)
        if record is None:
            record = UserAchievement(
                user_id=user.id,
                achievement_key=definition.key,
                progress_current=current_value,
                progress_target=definition.threshold,
            )
            db.add(record)
            existing[definition.key] = record
        else:
            record.progress_current = current_value
            record.progress_target = definition.threshold

        if record.unlocked_at is None and current_value >= definition.threshold:
            record.unlocked_at = datetime.utcnow()
            bonus = RARITY_XP_BONUS[definition.rarity]
            user.xp = (user.xp or 0) + bonus
            newly_unlocked.append(UnlockedAchievement(
                key=definition.key,
                name=definition.name,
                description=definition.description,
                icon=definition.icon,
                rarity=definition.rarity.value,
                xp_bonus=bonus,
            ))

    db.commit()
    return newly_unlocked


def get_achievements_overview(db: Session, user: User) -> List[dict]:
    """Full catalog joined with this user's progress, refreshing progress first."""
    evaluate_achievements(db, user)
    records = {
        ua.achievement_key: ua
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }
    overview = []
    for definition in ACHIEVEMENTS:
        record = records.get(definition.key)
        overview.append({
            "key": definition.key,
            "name": definition.name,
            "description": definition.description,
            "icon": definition.icon,
            "rarity": definition.rarity.value,
            "category": definition.category,
            "progress_current": record.progress_current if record else 0,
            "progress_target": definition.threshold,
            "unlocked_at": record.unlocked_at if record else None,
        })
    return overview
