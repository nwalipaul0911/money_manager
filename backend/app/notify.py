from sqlalchemy.orm import Session

from app.permissions import get_network_peer_ids
from app.realtime import notify_data_changed


def notify_network(db: Session, user_id: str) -> None:
    """Push updates to a user and everyone linked in their sponsor network."""
    notify_data_changed(get_network_peer_ids(db, user_id))
