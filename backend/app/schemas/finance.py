from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.finance import TransactionType
import uuid


class TransactionBase(BaseModel):
    type: TransactionType
    category: str
    amount: float
    description: Optional[str] = None
    date: date


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[date] = None


class TransactionResponse(TransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetBase(BaseModel):
    category: str
    amount: float
    month: int
    year: int


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[float] = None


class BudgetResponse(BudgetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    spent: float = 0
    remaining: float = 0
    created_at: datetime

    class Config:
        from_attributes = True


class SavingsGoalBase(BaseModel):
    title: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[date] = None
    color: str = "#6366f1"
    emoji: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[date] = None
    color: Optional[str] = None
    emoji: Optional[str] = None


class SavingsGoalResponse(SavingsGoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_achieved: bool
    progress_percent: float = 0
    created_at: datetime

    class Config:
        from_attributes = True


class FinanceSummary(BaseModel):
    total_income: float
    total_expenses: float
    savings: float
    month: int
    year: int
    by_category: dict
