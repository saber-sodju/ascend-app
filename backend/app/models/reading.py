from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base
from app.utils.guid import GUID


class BookStatus(str, enum.Enum):
    reading = "reading"
    completed = "completed"


class Book(Base):
    __tablename__ = "books"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=True)
    status = Column(SAEnum(BookStatus), default=BookStatus.reading)
    started_at = Column(Date, nullable=True)
    finished_at = Column(Date, nullable=True)
    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="books")
