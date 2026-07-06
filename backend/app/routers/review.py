from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import SponsorLink, Transaction, User, WishlistItem
from app.permissions import get_dependant_ids, get_profile
from app.schemas import TransactionResponse, WishlistResponse

router = APIRouter(prefix="/review", tags=["review"])


class PendingReviewResponse:
    pass


@router.get("/pending")
def pending_reviews(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dependant_ids = get_dependant_ids(db, user.id)
    if not dependant_ids:
        return {"transactions": [], "wishlist": [], "dependants": []}

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id.in_(dependant_ids), Transaction.status == "pending")
        .order_by(Transaction.submitted_at.desc())
        .all()
    )
    wishlist = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id.in_(dependant_ids), WishlistItem.status == "pending")
        .order_by(WishlistItem.created_at.desc())
        .all()
    )

    dependants = []
    for dep_id in dependant_ids:
        profile = get_profile(db, dep_id)
        link = (
            db.query(SponsorLink)
            .filter(SponsorLink.sponsor_user_id == user.id, SponsorLink.dependant_user_id == dep_id)
            .first()
        )
        if profile:
            dependants.append(
                {
                    "userId": dep_id,
                    "name": profile.name,
                    "relationship": link.relationship if link else "unknown",
                }
            )

    return {
        "transactions": [TransactionResponse.from_model(t) for t in transactions],
        "wishlist": [WishlistResponse.from_model(w) for w in wishlist],
        "dependants": dependants,
    }
