
import hashlib
import secrets
from datetime import datetime, timedelta, timezone


SESSION_DURATION_HOURS = 8


def generate_session_id() -> str:
    return secrets.token_urlsafe(32)


def hash_session_id(session_id: str) -> str:
    return hashlib.sha256(
        session_id.encode("utf-8")
    ).hexdigest()


def session_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(
        hours=SESSION_DURATION_HOURS
    )
