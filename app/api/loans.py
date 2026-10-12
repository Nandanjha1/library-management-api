
from datetime import datetime, timezone

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.librarian_dependencies import get_current_librarian
from app.repositories.loan_repository import checkout_copy, return_copy
from app.schemas.loan import CheckoutRequest, LoanResponse, ReturnResponse

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.post(
    "",
    response_model=LoanResponse,
    status_code=status.HTTP_201_CREATED,
)
def checkout_book(
    payload: CheckoutRequest,
    librarian: dict = Depends(get_current_librarian),
):
    if (
        payload.due_date.tzinfo is None
        or payload.due_date.utcoffset() is None
    ):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_DUE_DATE",
                "message": "due_date must include a timezone",
            },
        )

    if payload.due_date <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_DUE_DATE",
                "message": "due_date must be in the future",
            },
        )

    try:
        return checkout_copy(
            member_id=payload.member_id,
            copy_id=payload.copy_id,
            staff_id=librarian["staff_id"],
            due_date=payload.due_date,
        )
    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Unable to check out this copy",
            },
        )


@router.post("/{loan_id}/return", response_model=ReturnResponse)
def return_book(
    loan_id: int,
    librarian: dict = Depends(get_current_librarian),
):
    try:
        return return_copy(
            loan_id=loan_id,
            staff_id=librarian["staff_id"],
        )
    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_ERROR",
                "message": "Unable to process this return",
            },
        )
