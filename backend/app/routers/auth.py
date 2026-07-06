import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Invitation, Profile, SponsorLink, Transaction, User, WishlistItem, new_id
from app.permissions import get_dependant_ids, get_profile, is_dependant, is_sponsor
from app.schemas import (
    LoginRequest,
    NetworkMemberResponse,
    OnboardingRequest,
    ProfileResponse,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
    UserContextResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

COOLING_OFF_HOURS = 72


def _pending_review_count(db: Session, sponsor_user_id: str) -> int:
    dependant_ids = get_dependant_ids(db, sponsor_user_id)
    if not dependant_ids:
        return 0
    tx = (
        db.query(Transaction)
        .filter(Transaction.user_id.in_(dependant_ids), Transaction.status == "pending")
        .count()
    )
    wl = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id.in_(dependant_ids), WishlistItem.status == "pending")
        .count()
    )
    return tx + wl


def _network_members(db: Session, user_id: str, as_sponsor: bool) -> list[NetworkMemberResponse]:
    if as_sponsor:
        links = db.query(SponsorLink).filter(SponsorLink.sponsor_user_id == user_id).all()
        members = []
        for link in links:
            user = db.query(User).filter(User.id == link.dependant_user_id).first()
            profile = get_profile(db, link.dependant_user_id)
            if user and profile:
                members.append(
                    NetworkMemberResponse(
                        userId=user.id,
                        name=profile.name,
                        email=user.email,
                        relationship=link.relationship,
                    )
                )
        return members

    links = db.query(SponsorLink).filter(SponsorLink.dependant_user_id == user_id).all()
    members = []
    for link in links:
        user = db.query(User).filter(User.id == link.sponsor_user_id).first()
        profile = get_profile(db, link.sponsor_user_id)
        if user and profile:
            members.append(
                NetworkMemberResponse(
                    userId=user.id,
                    name=profile.name,
                    email=user.email,
                    relationship=link.relationship,
                )
            )
    return members


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    db.flush()
    profile = Profile(user_id=user.id, name=body.name, onboarding_complete=False)
    db.add(profile)
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserContextResponse)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return UserContextResponse(
        userId=user.id,
        email=user.email,
        profile=ProfileResponse.from_model(profile),
        isDependant=is_dependant(db, user.id),
        isSponsor=is_sponsor(db, user.id),
        dependants=_network_members(db, user.id, as_sponsor=True),
        sponsors=_network_members(db, user.id, as_sponsor=False),
        pendingReviewCount=_pending_review_count(db, user.id),
    )


@router.post("/onboarding", response_model=ProfileResponse)
def complete_onboarding(
    body: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile.name = body.name
    profile.net_income = body.net_income
    profile.wants_budget_percent = body.wants_budget_percent
    profile.fixed_expenses_json = json.dumps([e.model_dump() for e in body.fixed_expenses])
    profile.onboarding_complete = True
    db.commit()
    db.refresh(profile)
    return ProfileResponse.from_model(profile)


@router.patch("/profile", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile(db, user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    if body.name is not None:
        profile.name = body.name
    if body.net_income is not None:
        profile.net_income = body.net_income
    if body.wants_budget_percent is not None:
        profile.wants_budget_percent = body.wants_budget_percent
    if body.fixed_expenses is not None:
        profile.fixed_expenses_json = json.dumps([e.model_dump() for e in body.fixed_expenses])
    if body.auto_allocate_wants is not None:
        profile.auto_allocate_wants = body.auto_allocate_wants
    if body.onboarding_complete is not None:
        profile.onboarding_complete = body.onboarding_complete
    db.commit()
    db.refresh(profile)
    return ProfileResponse.from_model(profile)
