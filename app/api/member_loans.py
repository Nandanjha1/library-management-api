
import psycopg

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_member
from app.repositories.member_loan_repository import get_member_loans

router = APIRouter(prefix="/members/me", tags=["Member Loans"])


@router.get("/loans")
def read_my_loans(
    member: dict = Depends(get_current_member),
):
    try:
        return {"items": get_member_loans(member["member_id"])}
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to retrieve loans right now",
            },
        )
