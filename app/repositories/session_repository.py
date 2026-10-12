
from datetime import datetime

from app.db.connection import get_connection


def create_session(
    session_hash: str,
    staff_id: int,
    expires_at: datetime,
) -> None:
    sql = """
        INSERT INTO librarian_sessions (
            session_id,
            staff_id,
            expires_at
        )
        VALUES (%s, %s, %s)
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                sql,
                (session_hash, staff_id, expires_at),
            )


def get_active_session(session_hash: str) -> dict | None:
    sql = """
        SELECT
            s.session_id,
            s.staff_id,
            s.expires_at,
            st.full_name,
            st.email,
            st.is_active
        FROM librarian_sessions s
        JOIN staff st ON st.staff_id = s.staff_id
        WHERE s.session_id = %s
          AND s.revoked_at IS NULL
          AND s.expires_at > CURRENT_TIMESTAMP
          AND st.is_active = TRUE
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (session_hash,))
            return cursor.fetchone()


def revoke_session(session_hash: str) -> None:
    sql = """
        UPDATE librarian_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE session_id = %s
          AND revoked_at IS NULL
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (session_hash,))
