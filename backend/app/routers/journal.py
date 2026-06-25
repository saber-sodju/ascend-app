from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.journal import JournalEntry, JournalTag
from app.models.user import User
from app.schemas.journal import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=List[JournalEntryResponse])
def list_entries(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id)
    if search:
        q = q.filter(
            JournalEntry.what_i_did.ilike(f"%{search}%") |
            JournalEntry.what_i_learned.ilike(f"%{search}%") |
            JournalEntry.plan_for_tomorrow.ilike(f"%{search}%")
        )
    return q.order_by(JournalEntry.date.desc()).offset(offset).limit(limit).all()


@router.get("/today", response_model=Optional[JournalEntryResponse])
def get_today_entry(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id, JournalEntry.date == date.today()).first()


@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_entry(entry_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return entry


@router.post("", response_model=JournalEntryResponse)
def create_entry(data: JournalEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id, JournalEntry.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Запись за этот день уже существует")
    tags = data.tags
    entry_data = data.model_dump(exclude={"tags"})
    entry = JournalEntry(user_id=current_user.id, **entry_data)
    db.add(entry)
    db.flush()
    for tag in tags:
        db.add(JournalTag(entry_id=entry.id, tag=tag.strip()))
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_entry(entry_id: uuid.UUID, data: JournalEntryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    update_data = data.model_dump(exclude={"tags"}, exclude_none=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    if data.tags is not None:
        db.query(JournalTag).filter(JournalTag.entry_id == entry_id).delete()
        for tag in data.tags:
            db.add(JournalTag(entry_id=entry_id, tag=tag.strip()))
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_entry(entry_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(entry)
    db.commit()
    return {"message": "Запись удалена"}


@router.get("/stats/mood-chart")
def get_mood_chart(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import timedelta
    start = date.today() - timedelta(days=days)
    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date >= start
    ).order_by(JournalEntry.date).all()
    return [{"date": str(e.date), "mood": e.mood, "energy": e.energy, "productivity": e.productivity} for e in entries]
