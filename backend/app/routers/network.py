import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Invitation, Profile, SponsorLink, User
from app.notify import notify_network
from app.realtime import notify_data_changed
from app.permissions import get_profile, is_sponsor_of
from app.schemas import InvitationCreate, InvitationResponse
from app.utils.dates import ensure_utc, utcnow

router = APIRouter(prefix="/network", tags=["network"])


@router.post("/invitations", response_model=InvitationResponse)
def create_invitation(
    body: InvitationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitee_email = body.email.lower()
    if invitee_email == user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot invite yourself")

    existing_user = db.query(User).filter(User.email == invitee_email).first()
    if existing_user and is_sponsor_of(db, user.id, existing_user.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already linked to this user")

    pending = (
        db.query(Invitation)
        .filter(
            Invitation.sponsor_user_id == user.id,
            Invitation.invitee_email == invitee_email,
            Invitation.status == "pending",
        )
        .first()
    )
    if pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already pending")

    sponsor_profile = get_profile(db, user.id)
    now = utcnow()
    invitation = Invitation(
        token=secrets.token_urlsafe(32),
        sponsor_user_id=user.id,
        invitee_email=invitee_email,
        relationship=body.relationship,
        status="pending",
        expires_at=now + timedelta(days=settings.invitation_expire_days),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    invitee = db.query(User).filter(User.email == invitee_email).first()
    if invitee:
        notify_data_changed({invitee.id, user.id})
    return InvitationResponse(
        id=invitation.id,
        token=invitation.token,
        inviteeEmail=invitation.invitee_email,
        relationship=invitation.relationship,
        status=invitation.status,
        sponsorName=sponsor_profile.name if sponsor_profile else "Sponsor",
        createdAt=invitation.created_at,
        expiresAt=invitation.expires_at,
    )


@router.get("/invitations/pending", response_model=list[InvitationResponse])
def pending_invitations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = utcnow()
    rows = (
        db.query(Invitation)
        .filter(
            Invitation.invitee_email == user.email,
            Invitation.status == "pending",
        )
        .all()
    )
    rows = [inv for inv in rows if ensure_utc(inv.expires_at) > now]
    result = []
    for inv in rows:
        sponsor_profile = get_profile(db, inv.sponsor_user_id)
        result.append(
            InvitationResponse(
                id=inv.id,
                token=inv.token,
                inviteeEmail=inv.invitee_email,
                relationship=inv.relationship,
                status=inv.status,
                sponsorName=sponsor_profile.name if sponsor_profile else "Sponsor",
                createdAt=inv.created_at,
                expiresAt=inv.expires_at,
            )
        )
    return result


@router.get("/invitations/sent", response_model=list[InvitationResponse])
def sent_invitations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Invitation)
        .filter(Invitation.sponsor_user_id == user.id, Invitation.status == "pending")
        .all()
    )
    sponsor_profile = get_profile(db, user.id)
    return [
        InvitationResponse(
            id=inv.id,
            token=inv.token,
            inviteeEmail=inv.invitee_email,
            relationship=inv.relationship,
            status=inv.status,
            sponsorName=sponsor_profile.name if sponsor_profile else "Sponsor",
            createdAt=inv.created_at,
            expiresAt=inv.expires_at,
        )
        for inv in rows
    ]


@router.post("/invitations/{token}/accept")
def accept_invitation(token: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = utcnow()
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    if invitation.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation no longer valid")
    if ensure_utc(invitation.expires_at) < now:
        invitation.status = "expired"
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation expired")
    if invitation.invitee_email != user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This invitation is for another email")
    if invitation.sponsor_user_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot accept your own invitation")

    existing = (
        db.query(SponsorLink)
        .filter(
            SponsorLink.sponsor_user_id == invitation.sponsor_user_id,
            SponsorLink.dependant_user_id == user.id,
        )
        .first()
    )
    if existing:
        invitation.status = "accepted"
        db.commit()
        notify_network(db, user.id)
        return {"message": "Already linked", "linkId": existing.id}

    link = SponsorLink(
        sponsor_user_id=invitation.sponsor_user_id,
        dependant_user_id=user.id,
        relationship=invitation.relationship,
    )
    db.add(link)
    invitation.status = "accepted"
    db.commit()
    notify_network(db, user.id)
    return {"message": "Invitation accepted", "linkId": link.id}


@router.delete("/links/{link_id}")
def remove_link(link_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.query(SponsorLink).filter(SponsorLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    if link.sponsor_user_id != user.id and link.dependant_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    dependant_id = link.dependant_user_id
    sponsor_id = link.sponsor_user_id
    db.delete(link)
    db.commit()
    notify_data_changed({dependant_id, sponsor_id})
    return {"message": "Link removed"}
