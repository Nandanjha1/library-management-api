
import psycopg

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.core.security import verify_password
from app.core.session_security import (
    generate_session_id,
    hash_session_id,
    session_expiry,
)
from app.repositories.member_repository import get_staff_by_email
from app.repositories.session_repository import (
    create_session,
    revoke_session,
)

router = APIRouter(
    prefix="/auth/librarian",
    tags=["Librarian Authentication"],
)


class LibrarianLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


@router.post("/login")
def librarian_login(
    payload: LibrarianLoginRequest,
    response: Response,
):
    try:
        staff = get_staff_by_email(
            str(payload.email).strip().lower()
        )

        if (
            staff is None
            or not staff["is_active"]
            or not verify_password(
                payload.password,
                staff["password_hash"],
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "INVALID_CREDENTIALS",
                    "message": "Email or password is incorrect",
                },
            )

        session_id = generate_session_id()
        expires_at = session_expiry()

        create_session(
            hash_session_id(session_id),
            staff["staff_id"],
            expires_at,
        )

        response.set_cookie(
            key="library_session",
            value=session_id,
            httponly=True,
            secure=settings.app_env.lower() == "production",
            samesite="lax",
            max_age=8 * 60 * 60,
            path="/",
        )

        return {
            "message": "Librarian login successful",
            "staff": {
                "staff_id": staff["staff_id"],
                "full_name": staff["full_name"],
                "email": staff["email"],
            },
        }

    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to log in right now",
            },
        )


@router.post("/logout")
def librarian_logout(
    response: Response,
    library_session: str | None = Cookie(default=None),
):
    if library_session:
        try:
            revoke_session(hash_session_id(library_session))
        except psycopg.Error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "DATABASE_UNAVAILABLE",
                    "message": "Unable to end the session right now",
                },
            )

    response.delete_cookie(
        key="library_session",
        path="/",
        httponly=True,
        secure=settings.app_env.lower() == "production",
        samesite="lax",
    )

    return {"message": "Librarian logout successful"}
