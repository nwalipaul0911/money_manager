from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, WishlistAllocation, WishlistItem, new_id
from app.notify import notify_network
from app.permissions import can_edit_user, is_dependant, is_sponsor_of
from app.schemas import ReviewRequest, WishlistAllocate, WishlistCreate, WishlistResponse
from app.utils.dates import ensure_utc, utcnow

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

COOLING_OFF_HOURS = 72


def _cooling_off_end():
    return utcnow() + timedelta(hours=COOLING_OFF_HOURS)


@router.post("", response_model=WishlistResponse)
def create_wishlist_item(
    body: WishlistCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    needs_approval = is_dependant(db, user.id)
    now = utcnow()
    item = WishlistItem(
        id=new_id(),
        user_id=user.id,
        name=body.name,
        target_amount=body.targetAmount,
        saved_amount=0,
        cooling_off_until=now if needs_approval else _cooling_off_end(),
        status="pending" if needs_approval else "approved",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    notify_network(db, user.id)
    return WishlistResponse.from_model(item)


@router.delete("/{item_id}")
def delete_wishlist_item(
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    if not can_edit_user(db, user.id, item.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    db.delete(item)
    db.commit()
    notify_network(db, item.user_id)
    return {"message": "Deleted"}


@router.post("/{item_id}/review", response_model=WishlistResponse)
def review_wishlist_item(
    item_id: str,
    body: ReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    if not is_sponsor_of(db, user.id, item.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a sponsor of this user")
    if item.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not pending")

    item.reviewed_at = utcnow()
    item.reviewed_by_user_id = user.id
    if body.approved:
        item.status = "approved"
        item.cooling_off_until = _cooling_off_end()
    else:
        item.status = "rejected"
    db.commit()
    db.refresh(item)
    notify_network(db, item.user_id)
    return WishlistResponse.from_model(item)


@router.post("/{item_id}/allocate", response_model=WishlistResponse)
def allocate_to_wishlist(
    item_id: str,
    body: WishlistAllocate,
    user_id: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    target_user_id = item.user_id
    target_is_dependant = is_dependant(db, target_user_id)

    if target_is_dependant:
        if not is_sponsor_of(db, user.id, target_user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a sponsor")
    elif user.id != target_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if item.status != "approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item not approved")

    now = utcnow()
    if ensure_utc(item.cooling_off_until) > now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Still in cooling-off period")

    room = item.target_amount - item.saved_amount
    amount = min(body.amount, room)
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to allocate")

    allocation = WishlistAllocation(
        id=new_id(),
        user_id=target_user_id,
        item_id=item.id,
        amount=amount,
        date=utcnow().strftime("%Y-%m-%d"),
        allocated_by_user_id=user.id if user.id != target_user_id else None,
    )
    item.saved_amount += amount
    db.add(allocation)
    db.commit()
    db.refresh(item)
    notify_network(db, target_user_id)
    return WishlistResponse.from_model(item)
