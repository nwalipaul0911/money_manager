import json
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models import Profile, SponsorLink, Transaction, User, WishlistAllocation, WishlistItem


class FixedExpenseSchema(BaseModel):
    id: str
    name: str
    amount: float


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileUpdate(BaseModel):
    name: str | None = None
    net_income: float | None = None
    wants_budget_percent: float | None = Field(default=None, ge=10, le=70)
    fixed_expenses: list[FixedExpenseSchema] | None = None
    auto_allocate_wants: bool | None = None
    onboarding_complete: bool | None = None


class OnboardingRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    net_income: float = Field(gt=0)
    wants_budget_percent: float = Field(default=30, ge=10, le=70)
    fixed_expenses: list[FixedExpenseSchema] = Field(default_factory=list)


class ProfileResponse(BaseModel):
    id: str
    name: str
    netIncome: float
    wantsBudgetPercent: float
    fixedExpenses: list[FixedExpenseSchema]
    autoAllocateWants: bool
    onboardingComplete: bool

    @classmethod
    def from_model(cls, profile: Profile) -> "ProfileResponse":
        fixed = json.loads(profile.fixed_expenses_json or "[]")
        return cls(
            id=profile.user_id,
            name=profile.name,
            netIncome=profile.net_income,
            wantsBudgetPercent=profile.wants_budget_percent,
            fixedExpenses=fixed,
            autoAllocateWants=profile.auto_allocate_wants,
            onboardingComplete=profile.onboarding_complete,
        )


class NetworkMemberResponse(BaseModel):
    userId: str
    name: str
    email: str
    relationship: str


class InvitationCreate(BaseModel):
    email: EmailStr
    relationship: str


class InvitationResponse(BaseModel):
    id: str
    token: str
    inviteeEmail: str
    relationship: str
    status: str
    sponsorName: str
    createdAt: datetime
    expiresAt: datetime


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    date: str
    category: str
    pillar: str
    note: str | None = None


class TransactionResponse(BaseModel):
    id: str
    profileId: str
    amount: float
    date: str
    category: str
    pillar: str
    note: str | None
    status: str
    submittedAt: datetime
    reviewedAt: datetime | None = None
    reviewedByProfileId: str | None = None

    @classmethod
    def from_model(cls, tx: Transaction) -> "TransactionResponse":
        return cls(
            id=tx.id,
            profileId=tx.user_id,
            amount=tx.amount,
            date=tx.date,
            category=tx.category,
            pillar=tx.pillar,
            note=tx.note,
            status=tx.status,
            submittedAt=tx.submitted_at,
            reviewedAt=tx.reviewed_at,
            reviewedByProfileId=tx.reviewed_by_user_id,
        )


class WishlistCreate(BaseModel):
    name: str
    targetAmount: float = Field(gt=0)


class WishlistAllocate(BaseModel):
    amount: float = Field(gt=0)


class WishlistResponse(BaseModel):
    id: str
    profileId: str
    name: str
    targetAmount: float
    savedAmount: float
    createdAt: datetime
    coolingOffUntil: datetime
    status: str
    reviewedAt: datetime | None = None
    reviewedByProfileId: str | None = None

    @classmethod
    def from_model(cls, item: WishlistItem) -> "WishlistResponse":
        return cls(
            id=item.id,
            profileId=item.user_id,
            name=item.name,
            targetAmount=item.target_amount,
            savedAmount=item.saved_amount,
            createdAt=item.created_at,
            coolingOffUntil=item.cooling_off_until,
            status=item.status,
            reviewedAt=item.reviewed_at,
            reviewedByProfileId=item.reviewed_by_user_id,
        )


class WishlistAllocationResponse(BaseModel):
    id: str
    profileId: str
    itemId: str
    amount: float
    date: str
    allocatedByProfileId: str | None = None

    @classmethod
    def from_model(cls, a: WishlistAllocation) -> "WishlistAllocationResponse":
        return cls(
            id=a.id,
            profileId=a.user_id,
            itemId=a.item_id,
            amount=a.amount,
            date=a.date,
            allocatedByProfileId=a.allocated_by_user_id,
        )


class SponsorLinkResponse(BaseModel):
    id: str
    sponsorProfileId: str
    dependantProfileId: str
    relationship: str

    @classmethod
    def from_model(cls, link: SponsorLink) -> "SponsorLinkResponse":
        return cls(
            id=link.id,
            sponsorProfileId=link.sponsor_user_id,
            dependantProfileId=link.dependant_user_id,
            relationship=link.relationship,
        )


class UserContextResponse(BaseModel):
    userId: str
    email: str
    profile: ProfileResponse
    isDependant: bool
    isSponsor: bool
    dependants: list[NetworkMemberResponse]
    sponsors: list[NetworkMemberResponse]
    pendingReviewCount: int


class ProfileDataResponse(BaseModel):
    profile: ProfileResponse
    isOwnProfile: bool
    isDependant: bool
    canEdit: bool
    canLog: bool
    canAllocateWishlist: bool
    needsApproval: bool
    transactions: list[TransactionResponse]
    wishlist: list[WishlistResponse]
    wishlistAllocations: list[WishlistAllocationResponse]
    sponsorLinks: list[SponsorLinkResponse]


class ReviewRequest(BaseModel):
    approved: bool
