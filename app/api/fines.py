import psycopg
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_member
# from app.repositories.fine_repository import get_member_fines
from app.schemas.fine import FineResponse
from decimal import Decimal
from pydantic import BaseModel, Field
from app.core.librarian_dependencies import get_current_librarian
from fastapi.encoders import jsonable_encoder
from app.repositories.fine_repository import (
    get_member_fines,
    get_all_fines,
)

class DeskFinePaymentRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    payment_method: str

router = APIRouter(prefix="/fines", tags=["Fines"])

@router.post("/{fine_id}/record-payment")
def record_desk_payment(
    fine_id: int,
    request: DeskFinePaymentRequest,
    librarian=Depends(get_current_librarian),
):
    if request.payment_method not in {"cash", "card", "upi"}:
        raise HTTPException(
            status_code=422,
            detail="Unsupported payment method",
        )

    # This endpoint records a payment confirmed by the librarian.
    # It does not verify an online payment gateway transaction.
    from app.repositories.fine_repository import record_verified_payment

    try:
        payment = record_verified_payment(
            fine_id=fine_id,
            payment_amount=request.amount,
            payment_method=request.payment_method,
        )

        if payment is None:
            raise HTTPException(
                status_code=404,
                detail="Fine not found",
            )

        return jsonable_encoder({
            "message": "Payment recorded",
            "payment": payment,
        })
    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to record payment",
            },
        )


@router.get("")
def read_all_fines(
    librarian=Depends(get_current_librarian),
):
    try:
        return get_all_fines()
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to retrieve fines",
            },
        )


@router.get("/me", response_model=list[FineResponse])
def read_my_fines(member: dict = Depends(get_current_member)):
    try:
        return get_member_fines(member["member_id"])
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to retrieve fines",
            },
        )

'''
@router.post("/{fine_id}/pay", response_model=FineResponse)
def pay_fine(
    fine_id: int,
    payload: FinePaymentRequest,
    member: dict = Depends(get_current_member),
):
    try:
        return record_fine_payment(
            fine_id=fine_id,
            member_id=member["member_id"],
            payment_amount=payload.amount,
        )
    except HTTPException:
        raise
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to record payment",
            },
        )
'''
