from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.goal import Goal, SubGoal, GoalMilestone, GoalStatus
from app.models.habit import Habit, HabitGoalLink
from app.models.user import User
from app.schemas.goal import (
    GoalCreate, GoalUpdate, GoalResponse, SubGoalCreate, SubGoalUpdate, SubGoalResponse,
    MilestoneCreate, MilestoneResponse, HabitLinkRequest,
)
from app.routers.deps import get_current_user
from app.gamification.goal_progress import compute_goal_progress
from app.gamification.engine import evaluate_achievements
import uuid

router = APIRouter(prefix="/goals", tags=["goals"])


def maybe_complete_goal(goal: Goal) -> None:
    if goal.status != GoalStatus.completed and goal.target_value and goal.current_value >= goal.target_value:
        goal.status = GoalStatus.completed


def goal_to_response(goal: Goal) -> GoalResponse:
    progress = compute_goal_progress(goal)
    data = GoalResponse.model_validate(goal)
    data.progress_percent = progress.percent
    data.linked_habits = progress.habits
    data.forecast_date = progress.forecast_date
    return data


@router.get("", response_model=List[GoalResponse])
def list_goals(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Goal).filter(Goal.user_id == current_user.id)
    if status:
        q = q.filter(Goal.status == status)
    if category:
        q = q.filter(Goal.category == category)
    return [goal_to_response(g) for g in q.order_by(Goal.created_at.desc()).all()]


@router.post("", response_model=GoalResponse)
def create_goal(data: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub_goals_data = data.sub_goals
    goal_data = data.model_dump(exclude={"sub_goals"})
    goal = Goal(user_id=current_user.id, **goal_data)
    db.add(goal)
    db.flush()
    for i, sg in enumerate(sub_goals_data):
        db.add(SubGoal(goal_id=goal.id, order=i, **sg.model_dump()))
    db.commit()
    db.refresh(goal)
    return goal_to_response(goal)


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    return goal_to_response(goal)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: uuid.UUID, data: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    was_completed = goal.status == GoalStatus.completed
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    maybe_complete_goal(goal)
    db.commit()
    db.refresh(goal)
    if goal.status == GoalStatus.completed and not was_completed:
        evaluate_achievements(db, current_user)
    return goal_to_response(goal)


@router.delete("/{goal_id}")
def delete_goal(goal_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    db.delete(goal)
    db.commit()
    return {"message": "Цель удалена"}


@router.post("/{goal_id}/sub-goals", response_model=SubGoalResponse)
def add_sub_goal(goal_id: uuid.UUID, data: SubGoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    sg = SubGoal(goal_id=goal_id, **data.model_dump())
    db.add(sg)
    db.commit()
    db.refresh(sg)
    return sg


@router.put("/{goal_id}/sub-goals/{sg_id}", response_model=SubGoalResponse)
def update_sub_goal(goal_id: uuid.UUID, sg_id: uuid.UUID, data: SubGoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    sg = db.query(SubGoal).filter(SubGoal.id == sg_id, SubGoal.goal_id == goal_id).first()
    if not sg:
        raise HTTPException(status_code=404, detail="Подзадача не найдена")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(sg, field, value)
    db.commit()
    db.refresh(sg)
    return sg


@router.delete("/{goal_id}/sub-goals/{sg_id}")
def delete_sub_goal(goal_id: uuid.UUID, sg_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sg = db.query(SubGoal).filter(SubGoal.id == sg_id, SubGoal.goal_id == goal_id).first()
    if not sg:
        raise HTTPException(status_code=404, detail="Подзадача не найдена")
    db.delete(sg)
    db.commit()
    return {"message": "Удалено"}


@router.post("/{goal_id}/milestones", response_model=MilestoneResponse)
def add_milestone(goal_id: uuid.UUID, data: MilestoneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    m = GoalMilestone(goal_id=goal_id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.post("/{goal_id}/link-habit", response_model=GoalResponse)
def link_habit(goal_id: uuid.UUID, data: HabitLinkRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    habit = db.query(Habit).filter(Habit.id == data.habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Привычка не найдена")
    existing = db.query(HabitGoalLink).filter(HabitGoalLink.goal_id == goal_id, HabitGoalLink.habit_id == data.habit_id).first()
    if existing:
        existing.impact_weight = data.impact_weight
    else:
        db.add(HabitGoalLink(goal_id=goal_id, habit_id=data.habit_id, impact_weight=data.impact_weight))
    db.commit()
    db.refresh(goal)
    return goal_to_response(goal)


@router.delete("/{goal_id}/link-habit/{habit_id}", response_model=GoalResponse)
def unlink_habit(goal_id: uuid.UUID, habit_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Цель не найдена")
    db.query(HabitGoalLink).filter(HabitGoalLink.goal_id == goal_id, HabitGoalLink.habit_id == habit_id).delete()
    db.commit()
    db.refresh(goal)
    return goal_to_response(goal)


@router.delete("/clear")
def clear_all_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Goal).filter(Goal.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Все цели удалены"}
