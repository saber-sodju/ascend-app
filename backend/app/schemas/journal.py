from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import uuid


class JournalTagResponse(BaseModel):
    id: uuid.UUID
    tag: str

    class Config:
        from_attributes = True


class JournalEntryBase(BaseModel):
    date: date
    what_i_did: Optional[str] = None
    what_failed: Optional[str] = None
    what_i_learned: Optional[str] = None
    plan_for_tomorrow: Optional[str] = None
    mood: Optional[int] = None
    energy: Optional[int] = None
    productivity: Optional[int] = None


class JournalEntryCreate(JournalEntryBase):
    tags: List[str] = []


class JournalEntryUpdate(BaseModel):
    what_i_did: Optional[str] = None
    what_failed: Optional[str] = None
    what_i_learned: Optional[str] = None
    plan_for_tomorrow: Optional[str] = None
    mood: Optional[int] = None
    energy: Optional[int] = None
    productivity: Optional[int] = None
    tags: Optional[List[str]] = None


class JournalEntryResponse(JournalEntryBase):
    id: uuid.UUID
    user_id: uuid.UUID
    tags: List[JournalTagResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
