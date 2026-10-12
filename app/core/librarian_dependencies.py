import psycopg
from fastapi import Cookie, HTTPException, status
from app.core.session_security import hash_session_id
from app.repositories.session_repository import get_active_session

def get_current_librarian(
    library_session: str | None = Cookie(default=None),
) -> dict:
    if not library_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "LIBRARIAN_SESSION_REQUIRED",
                "message": "Please log in as a librarian",
            },
        )
    session_hash = hash_session_id(library_session)
    try:
        session = get_active_session(session_hash)
    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to validate the librarian session",
            },
        )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_LIBRARIAN_SESSION",
                "message": "The session is invalid or expired",
            },
        )
    return session
