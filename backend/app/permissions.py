from sqlalchemy.orm import Session

from app.models import Profile, SponsorLink, User


def is_dependant(db: Session, user_id: str) -> bool:
    return (
        db.query(SponsorLink)
        .filter(SponsorLink.dependant_user_id == user_id)
        .first()
        is not None
    )


def is_sponsor(db: Session, user_id: str) -> bool:
    return (
        db.query(SponsorLink)
        .filter(SponsorLink.sponsor_user_id == user_id)
        .first()
        is not None
    )


def get_dependant_ids(db: Session, sponsor_user_id: str) -> list[str]:
    rows = (
        db.query(SponsorLink.dependant_user_id)
        .filter(SponsorLink.sponsor_user_id == sponsor_user_id)
        .all()
    )
    return [r[0] for r in rows]


def can_view_user(db: Session, viewer_id: str, target_user_id: str) -> bool:
    if viewer_id == target_user_id:
        return True
    return (
        db.query(SponsorLink)
        .filter(
            SponsorLink.sponsor_user_id == viewer_id,
            SponsorLink.dependant_user_id == target_user_id,
        )
        .first()
        is not None
    )


def can_edit_user(db: Session, editor_id: str, target_user_id: str) -> bool:
    return editor_id == target_user_id


def is_sponsor_of(db: Session, sponsor_id: str, dependant_id: str) -> bool:
    return (
        db.query(SponsorLink)
        .filter(
            SponsorLink.sponsor_user_id == sponsor_id,
            SponsorLink.dependant_user_id == dependant_id,
        )
        .first()
        is not None
    )


def get_profile(db: Session, user_id: str) -> Profile | None:
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def get_user(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_network_peer_ids(db: Session, user_id: str) -> set[str]:
    peers = {user_id}
    sponsor_rows = (
        db.query(SponsorLink.sponsor_user_id)
        .filter(SponsorLink.dependant_user_id == user_id)
        .all()
    )
    dependant_rows = (
        db.query(SponsorLink.dependant_user_id)
        .filter(SponsorLink.sponsor_user_id == user_id)
        .all()
    )
    for (sid,) in sponsor_rows:
        peers.add(sid)
    for (did,) in dependant_rows:
        peers.add(did)
    return peers
