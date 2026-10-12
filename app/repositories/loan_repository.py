from datetime import datetime, timezone
from decimal import Decimal
from fastapi import HTTPException, status
from app.db.connection import get_connection

def checkout_copy(
    member_id: int,
    copy_id: int,
    staff_id: int,
    due_date: datetime,
) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            # Lock the member so concurrent checkout requests for
            # the same member cannot bypass the three-loan limit.
            cursor.execute(
                """
                SELECT member_id
                FROM members
                WHERE member_id = %s AND is_active = TRUE
                FOR UPDATE
                """,
                (member_id,),
            )
            member = cursor.fetchone()

            if member is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "code": "MEMBER_NOT_FOUND",
                        "message": "Active member not found",
                    },
                )

            # Lock the copy to prevent simultaneous checkout.
            cursor.execute(
                """
                SELECT copy_id, status
                FROM book_copies
                WHERE copy_id = %s
                FOR UPDATE
                """,
                (copy_id,),
            )
            copy = cursor.fetchone()

            if copy is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "code": "COPY_NOT_FOUND",
                        "message": "Physical copy not found",
                    },
                )

            if copy["status"] != "available":
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "COPY_UNAVAILABLE",
                        "message": "This copy is not available",
                    },
                )

            cursor.execute(
                """
                SELECT COUNT(*) AS active_loans
                FROM loans
                WHERE member_id = %s AND returned_at IS NULL
                """,
                (member_id,),
            )
            active_loans = cursor.fetchone()["active_loans"]

            if active_loans >= 3:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "LOAN_LIMIT_REACHED",
                        "message": "A member may hold at most three books",
                    },
                )

            cursor.execute(
                """
                INSERT INTO loans (
                    member_id, copy_id, checked_out_by, due_date
                )
                VALUES (%s, %s, %s, %s)
                RETURNING
                    loan_id, member_id, copy_id, checked_out_by,
                    checkout_date, due_date, returned_at
                """,
                (member_id, copy_id, staff_id, due_date),
            )
            loan = cursor.fetchone()

            cursor.execute(
                """
                UPDATE book_copies
                SET status = 'loaned'
                WHERE copy_id = %s
                """,
                (copy_id,),
            )
    return loan


def return_copy(loan_id: int, staff_id: int) -> dict:
    returned_at = datetime.now(timezone.utc)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    loan_id, copy_id, due_date, returned_at
                FROM loans
                WHERE loan_id = %s
                FOR UPDATE
                """,
                (loan_id,),
            )
            loan = cursor.fetchone()

            if loan is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "code": "LOAN_NOT_FOUND",
                        "message": "Loan not found",
                    },
                )

            if loan["returned_at"] is not None:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "LOAN_ALREADY_RETURNED",
                        "message": "This loan has already been returned",
                    },
                )

            due_date = loan["due_date"]
            overdue_days = max(
                0,
                (returned_at.date() - due_date.date()).days,
            )
            fine_amount = Decimal(overdue_days) * Decimal("10.00")

            cursor.execute(
                """
                UPDATE loans
                SET returned_at = %s, returned_to = %s
                WHERE loan_id = %s
                """,
                (returned_at, staff_id, loan_id),
            )

            cursor.execute(
                """
                UPDATE book_copies
                SET status = 'available'
                WHERE copy_id = %s
                """,
                (loan["copy_id"],),
            )

            if fine_amount > 0:
                cursor.execute(
                    """
                    INSERT INTO fines (
                        loan_id, amount, amount_paid, payment_status
                    )
                    VALUES (%s, %s, 0, 'unpaid')
                    """,
                    (loan_id, fine_amount),
                )

    return {
        "loan_id": loan_id,
        "returned_at": returned_at,
        "overdue_days": overdue_days,
        "fine_amount": float(fine_amount),
        "message": "Book returned successfully",
    }
