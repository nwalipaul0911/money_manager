import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="user",
        foreign_keys="Transaction.user_id",
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(
        back_populates="user",
        foreign_keys="WishlistItem.user_id",
    )
    wishlist_allocations: Mapped[list["WishlistAllocation"]] = relationship(
        back_populates="user",
        foreign_keys="WishlistAllocation.user_id",
    )


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    net_income: Mapped[float] = mapped_column(Float, default=0)
    wants_budget_percent: Mapped[float] = mapped_column(Float, default=30)
    fixed_expenses_json: Mapped[str] = mapped_column(Text, default="[]")
    auto_allocate_wants: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="profile")


class SponsorLink(Base):
    __tablename__ = "sponsor_links"
    __table_args__ = (UniqueConstraint("sponsor_user_id", "dependant_user_id", name="uq_sponsor_dependant"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    sponsor_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    dependant_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    relationship: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    sponsor_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    invitee_email: Mapped[str] = mapped_column(String(255), index=True)
    relationship: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[str] = mapped_column(String(10))
    category: Mapped[str] = mapped_column(String(100))
    pillar: Mapped[str] = mapped_column(String(10))
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="approved")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    user: Mapped[User] = relationship(back_populates="transactions", foreign_keys=[user_id])


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    target_amount: Mapped[float] = mapped_column(Float)
    saved_amount: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    cooling_off_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="approved")
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    user: Mapped[User] = relationship(back_populates="wishlist_items", foreign_keys=[user_id])


class WishlistAllocation(Base):
    __tablename__ = "wishlist_allocations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("wishlist_items.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[str] = mapped_column(String(10))
    allocated_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    user: Mapped[User] = relationship(back_populates="wishlist_allocations", foreign_keys=[user_id])
