
import psycopg

from fastapi import Header, HTTPException, status

from app.core.security import verify_password
from app.db.connection import get_connection


def get_authenticated_partner(
    x_api_key: str | None = Header(default=None),
    x_api_secret: str | None = Header(default=None),
) -> dict:
    if not x_api_key or not x_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "PARTNER_CREDENTIALS_REQUIRED",
                "message": "API key and secret are required",
            },
            headers={"WWW-Authenticate": "ApiKey"},
        )

    sql = """
        SELECT partner_id, partner_name, api_key, secret_hash
        FROM partner_clients
        WHERE api_key = %s
          AND is_active = TRUE
    """

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql, (x_api_key,))
                partner = cursor.fetchone()

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to authenticate partner",
            },
        )

    if (
        partner is None
        or not verify_password(
            x_api_secret,
            partner["secret_hash"],
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_PARTNER_CREDENTIALS",
                "message": "Partner credentials are invalid",
            },
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return {
        "partner_id": partner["partner_id"],
        "partner_name": partner["partner_name"],
    }
