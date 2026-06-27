from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime
import calendar
from app.database import get_db
from app.models.finance import Transaction, Budget, SavingsGoal, TransactionType
from app.models.user import User
from app.schemas.finance import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    BudgetCreate, BudgetUpdate, BudgetResponse,
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse,
    FinanceSummary
)
from app.routers.deps import get_current_user
import uuid

router = APIRouter(prefix="/finance", tags=["finance"])


def month_range(y: int, m: int):
    _, last = calendar.monthrange(y, m)
    return date(y, m, 1), date(y, m, last)


@router.get("/transactions", response_model=List[TransactionResponse])
def list_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if type:
        q = q.filter(Transaction.type == type)
    if category:
        q = q.filter(Transaction.category == category)
    if month and year:
        start, end = month_range(year, month)
        q = q.filter(Transaction.date >= start, Transaction.date <= end)
    elif year:
        q = q.filter(Transaction.date >= date(year, 1, 1), Transaction.date <= date(year, 12, 31))
    return q.order_by(Transaction.date.desc()).limit(limit).all()


@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = Transaction(user_id=current_user.id, **data.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/transactions/{tx_id}", response_model=TransactionResponse)
def update_transaction(tx_id: uuid.UUID, data: TransactionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    db.delete(tx)
    db.commit()
    return {"message": "Удалено"}


@router.get("/summary", response_model=FinanceSummary)
def get_summary(month: int = None, year: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    m = month or today.month
    y = year or today.year
    start, end = month_range(y, m)
    txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= start,
        Transaction.date <= end
    ).all()
    income = sum(t.amount for t in txs if t.type == TransactionType.income)
    expenses = sum(t.amount for t in txs if t.type == TransactionType.expense)
    by_cat: dict = {}
    for t in txs:
        by_cat.setdefault(t.category, {"income": 0, "expense": 0})
        by_cat[t.category][t.type.value] += t.amount
    return FinanceSummary(total_income=income, total_expenses=expenses, savings=income - expenses, month=m, year=y, by_category=by_cat)


@router.get("/budgets", response_model=List[BudgetResponse])
def list_budgets(month: int = None, year: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    m = month or today.month
    y = year or today.year
    start, end = month_range(y, m)
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month == m, Budget.year == y).all()
    result = []
    for b in budgets:
        spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == b.category,
            Transaction.type == TransactionType.expense,
            Transaction.date >= start,
            Transaction.date <= end
        ).scalar() or 0
        br = BudgetResponse.model_validate(b)
        br.spent = spent
        br.remaining = b.amount - spent
        result.append(br)
    return result


@router.post("/budgets", response_model=BudgetResponse)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = Budget(user_id=current_user.id, **data.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    br = BudgetResponse.model_validate(b)
    br.spent = 0
    br.remaining = b.amount
    return br


@router.delete("/budgets/{budget_id}")
def delete_budget(budget_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Бюджет не найден")
    db.delete(b)
    db.commit()
    return {"message": "Удалено"}


@router.get("/savings-goals", response_model=List[SavingsGoalResponse])
def list_savings_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    result = []
    for g in goals:
        gr = SavingsGoalResponse.model_validate(g)
        gr.progress_percent = round(g.current_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
        result.append(gr)
    return result


@router.post("/savings-goals", response_model=SavingsGoalResponse)
def create_savings_goal(data: SavingsGoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = SavingsGoal(user_id=current_user.id, **data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    gr = SavingsGoalResponse.model_validate(g)
    gr.progress_percent = round(g.current_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
    return gr


@router.put("/savings-goals/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(goal_id: uuid.UUID, data: SavingsGoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Цель накоплений не найдена")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(g, field, value)
    if g.current_amount >= g.target_amount:
        g.is_achieved = True
    db.commit()
    db.refresh(g)
    gr = SavingsGoalResponse.model_validate(g)
    gr.progress_percent = round(g.current_amount / g.target_amount * 100, 1) if g.target_amount > 0 else 0
    return gr


@router.delete("/savings-goals/{goal_id}")
def delete_savings_goal(goal_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Цель накоплений не найдена")
    db.delete(g)
    db.commit()
    return {"message": "Удалено"}


@router.get("/chart/monthly")
def get_monthly_chart(year: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    y = year or date.today().year
    result = []
    for m in range(1, 13):
        start, end = month_range(y, m)
        txs = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= start,
            Transaction.date <= end
        ).all()
        income = sum(t.amount for t in txs if t.type == TransactionType.income)
        expense = sum(t.amount for t in txs if t.type == TransactionType.expense)
        result.append({"month": m, "income": income, "expense": expense, "savings": income - expense})
    return result


@router.delete("/clear")
def clear_all_finance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
    db.query(Budget).filter(Budget.user_id == current_user.id).delete()
    db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Все финансовые данные удалены"}
