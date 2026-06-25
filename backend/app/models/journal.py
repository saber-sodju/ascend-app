from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base
from app.utils.guid import GUID


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    what_i_did = Column(Text, nullable=True)
    what_failed = Column(Text, nullable=True)
    what_i_learned = Column(Text, nullable=True)
    plan_for_tomorrow = Column(Text, nullable=True)
    mood = Column(Integer, nullable=True)
    energy = Column(Integer, nullable=True)
    productivity = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="journal_entries")
    tags = relationship("JournalTag", back_populates="entry", cascade="all, delete-orphan")


class JournalTag(Base):
    __tablename__ = "journal_tags"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    entry_id = Column(GUID(), ForeignKey("journal_entries.id"), nullable=False)
    tag = Column(String(100), nullable=False)

    entry = relationship("JournalEntry", back_populates="tags")
