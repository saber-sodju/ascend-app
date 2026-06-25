from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, AdminUserUpdate, AdminPasswordReset
from app.utils.security import get_password_hash
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/users", tags=["users"])


def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав администратора")
    return current_user


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at).all()


@router.post("", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.query(User).filter((User.email == data.email) | (User.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким email или username уже существует")
    user = User(
        id=uuid.uuid4(),
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, data: AdminUserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.new_password:
        user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Нельзя удалить себя")
    db.delete(user)
    db.commit()
    return {"message": "Пользователь удалён"}
