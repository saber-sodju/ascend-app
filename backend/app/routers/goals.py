from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.goal import Goal, SubGoal, GoalMilestone, GoalStatus
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse, SubGoalCreate, SubGoalUpdate, SubGoalResponse, MilestoneCreate, MilestoneResponse
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/goals", tags=["goals"])


def calc_progress(goal: Goal) -> float:
    if goal.target_value and goal.target_value > 0:
        return min(100, round((goal.current_value / goal.target_value) * 100, 1))
    sub_total = len(goal.sub_goals)
    if sub_total > 0:
        return round(sum(1 for s in goal.sub_goals if s.is_completed) / sub_total * 100, 1)
    return 0


def goal_to_response(goal: Goal) -> GoalResponse:
    data = GoalResponse.model_validate(goal)
    data.progress_percent = calc_progress(goal)
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
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    if goal.status != GoalStatus.completed and goal.target_value and goal.current_value >= goal.target_value:
        goal.status = GoalStatus.completed
    db.commit()
    db.refresh(goal)
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
