from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.reading import Book, BookStatus
from app.models.user import User
from app.schemas.reading import BookCreate, BookUpdate, BookResponse
from app.routers.deps import get_current_user
from app.gamification.engine import evaluate_achievements
import uuid

router = APIRouter(prefix="/reading", tags=["reading"])


@router.get("", response_model=List[BookResponse])
def list_books(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Book).filter(Book.user_id == current_user.id).order_by(Book.created_at.desc()).all()


@router.post("", response_model=BookResponse)
def create_book(data: BookCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = Book(user_id=current_user.id, **data.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    if book.status == BookStatus.completed:
        evaluate_achievements(db, current_user)
    return book


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: uuid.UUID, data: BookUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    was_completed = book.status == BookStatus.completed
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    if book.status == BookStatus.completed and not was_completed:
        evaluate_achievements(db, current_user)
    return book


@router.delete("/{book_id}")
def delete_book(book_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    db.delete(book)
    db.commit()
    return {"message": "Удалено"}


@router.delete("/clear")
def clear_all_books(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Book).filter(Book.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Все книги удалены"}
