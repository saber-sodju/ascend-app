from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.reading import BookStatus
import uuid


class BookBase(BaseModel):
    title: str
    author: Optional[str] = None
    status: BookStatus = BookStatus.reading
    started_at: Optional[date] = None
    finished_at: Optional[date] = None
    rating: Optional[int] = None
    notes: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[BookStatus] = None
    started_at: Optional[date] = None
    finished_at: Optional[date] = None
    rating: Optional[int] = None
    notes: Optional[str] = None


class BookResponse(BookBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
