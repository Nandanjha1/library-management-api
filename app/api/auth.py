
import psycopg
from fastapi import APIRouter, HTTPException, status

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.repositories.member_repository import (
    create_member,
    get_member_by_email,
)
from app.schemas.auth import (
    MemberLoginRequest,
    MemberRegisterRequest,
    MemberResponse,
    TokenResponse,
)

router = APIRouter(prefix="/auth/member", tags=["Member Authentication"])


@router.post(
    "/register",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_member(payload: MemberRegisterRequest):
    email = str(payload.email).strip().lower()

    try:
        return create_member(
            full_name=payload.full_name.strip(),
            email=email,
            password_hash=hash_password(payload.password),
        )

    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "EMAIL_ALREADY_REGISTERED",
                "message": "An account with this email already exists",
            },
        )

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to register member right now",
            },
        )


@router.post("/login", response_model=TokenResponse)
def login_member(payload: MemberLoginRequest):
    email = str(payload.email).strip().lower()

    try:
        member = get_member_by_email(email)

        if (
            member is None
            or not member["is_active"]
            or not verify_password(
                payload.password,
                member["password_hash"],
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "INVALID_CREDENTIALS",
                    "message": "Email or password is incorrect",
                },
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "access_token": create_access_token(member["member_id"]),
            "token_type": "bearer",
        }

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to log in right now",
            },
        )
