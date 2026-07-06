from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import SponsorLink, Transaction, User, WishlistAllocation, WishlistItem
from app.permissions import can_view_user, get_profile, is_dependant, is_sponsor_of
from app.schemas import (
    ProfileDataResponse,
    ProfileResponse,
    SponsorLinkResponse,
    TransactionResponse,
    WishlistAllocationResponse,
    WishlistResponse,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/{user_id}/data", response_model=ProfileDataResponse)
def get_profile_data(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_view_user(db, user.id, user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view this profile")

    profile = get_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    is_own = user.id == user_id
    target_is_dependant = is_dependant(db, user_id)

    transactions = (
        db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.submitted_at.desc()).all()
    )
    wishlist = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
        .all()
    )
    allocations = db.query(WishlistAllocation).filter(WishlistAllocation.user_id == user_id).all()

    links = (
        db.query(SponsorLink)
        .filter(
            (SponsorLink.sponsor_user_id == user_id) | (SponsorLink.dependant_user_id == user_id)
        )
        .all()
    )

    return ProfileDataResponse(
        profile=ProfileResponse.from_model(profile),
        isOwnProfile=is_own,
        isDependant=target_is_dependant,
        canEdit=is_own,
        canLog=is_own,
        canAllocateWishlist=is_own and not target_is_dependant,
        needsApproval=target_is_dependant,
        transactions=[TransactionResponse.from_model(t) for t in transactions],
        wishlist=[WishlistResponse.from_model(w) for w in wishlist],
        wishlistAllocations=[WishlistAllocationResponse.from_model(a) for a in allocations],
        sponsorLinks=[SponsorLinkResponse.from_model(l) for l in links],
    )
