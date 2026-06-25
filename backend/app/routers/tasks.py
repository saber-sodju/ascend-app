from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskReorderRequest
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])


def update_overdue(tasks: List[Task]):
    today = date.today()
    for task in tasks:
        if task.due_date and task.due_date < today and task.status == TaskStatus.todo:
            task.status = TaskStatus.overdue


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    due_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        q = q.filter(Task.status == status)
    if category:
        q = q.filter(Task.category == category)
    if due_date:
        q = q.filter(Task.due_date == due_date)
    tasks = q.order_by(Task.order, Task.created_at.desc()).all()
    update_overdue(tasks)
    db.commit()
    return tasks


@router.post("", response_model=TaskResponse)
def create_task(data: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    max_order = db.query(Task).filter(Task.user_id == current_user.id).count()
    task = Task(user_id=current_user.id, order=max_order, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: uuid.UUID, data: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    if data.status == TaskStatus.completed and not task.completed_at:
        task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    db.delete(task)
    db.commit()
    return {"message": "Задача удалена"}


@router.post("/reorder")
def reorder_tasks(data: TaskReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for i, task_id in enumerate(data.task_ids):
        task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
        if task:
            task.order = i
    db.commit()
    return {"message": "Порядок обновлён"}


@router.get("/today/list", response_model=List[TaskResponse])
def get_today_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.due_date == today,
        Task.status != TaskStatus.completed
    ).order_by(Task.order).all()
    return tasks
