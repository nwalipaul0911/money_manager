from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Transaction, User, new_id
from app.notify import notify_network
from app.permissions import can_edit_user, is_dependant, is_sponsor_of
from app.schemas import ReviewRequest, TransactionCreate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])

COOLING_OFF_HOURS = 72


@router.post("", response_model=TransactionResponse)
def create_transaction(
    body: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    needs_approval = is_dependant(db, user.id)
    tx = Transaction(
        id=new_id(),
        user_id=user.id,
        amount=body.amount,
        date=body.date,
        category=body.category,
        pillar=body.pillar,
        note=body.note,
        status="pending" if needs_approval else "approved",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    notify_network(db, user.id)
    return TransactionResponse.from_model(tx)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if tx.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if tx.status != "pending" and not (tx.status == "approved" and not is_dependant(db, user.id)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete")
    db.delete(tx)
    db.commit()
    notify_network(db, tx.user_id)
    return {"message": "Deleted"}


@router.post("/{transaction_id}/review", response_model=TransactionResponse)
def review_transaction(
    transaction_id: str,
    body: ReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    if not is_sponsor_of(db, user.id, tx.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a sponsor of this user")
    if tx.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not pending")

    tx.status = "approved" if body.approved else "rejected"
    tx.reviewed_at = datetime.now(timezone.utc)
    tx.reviewed_by_user_id = user.id
    db.commit()
    db.refresh(tx)
    notify_network(db, tx.user_id)
    return TransactionResponse.from_model(tx)
