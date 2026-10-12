from decimal import Decimal
# import psycopg
from fastapi import HTTPException
from app.db.connection import get_connection

def get_member_fines(member_id: int) -> list[dict]:
    sql = """
        SELECT
            f.fine_id,
            f.loan_id,
            f.amount,
            f.amount_paid,
            f.payment_status,
            f.created_at,
            f.paid_at
        FROM fines f
        JOIN loans l ON l.loan_id = f.loan_id
        WHERE l.member_id = %s
        ORDER BY f.created_at DESC, f.fine_id DESC
    """
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (member_id,))
            return cursor.fetchall()


def get_all_fines() -> list[dict]:
    sql = """
        SELECT
            f.fine_id,
            l.member_id,
            f.loan_id,
            f.amount,
            f.amount_paid,
            f.payment_status,
            f.created_at,
            f.paid_at
        FROM fines f
        JOIN loans l ON l.loan_id = f.loan_id
        ORDER BY f.created_at DESC, f.fine_id DESC
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return cursor.fetchall()


def record_fine_payment(
    fine_id: int,
    member_id: int,
    payment_amount: Decimal,
) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    f.fine_id,
                    f.loan_id,
                    f.amount,
                    f.amount_paid,
                    f.payment_status
                FROM fines f
                JOIN loans l ON l.loan_id = f.loan_id
                WHERE f.fine_id = %s
                  AND l.member_id = %s
                FOR UPDATE OF f
                """,
                (fine_id, member_id),
            )
            fine = cursor.fetchone()

            if fine is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "code": "FINE_NOT_FOUND",
                        "message": "Fine not found",
                    },
                )

            outstanding = fine["amount"] - fine["amount_paid"]

            if payment_amount > outstanding:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "PAYMENT_EXCEEDS_BALANCE",
                        "message": "Payment exceeds the outstanding balance",
                    },
                )

            new_amount_paid = fine["amount_paid"] + payment_amount
            fully_paid = new_amount_paid == fine["amount"]
            new_status = "paid" if fully_paid else "partial"

            cursor.execute(
                """
                UPDATE fines
                SET
                    amount_paid = %s,
                    payment_status = %s,
                    paid_at = CASE
                        WHEN %s THEN CURRENT_TIMESTAMP
                        ELSE NULL
                    END
                WHERE fine_id = %s
                RETURNING
                    fine_id, loan_id, amount, amount_paid,
                    payment_status, created_at, paid_at
                """,
                (
                    new_amount_paid,
                    new_status,
                    fully_paid,
                    fine_id,
                ),
            )
            return cursor.fetchone()


def record_verified_payment(
    fine_id: int,
    payment_amount: Decimal,
    payment_method: str,
    transaction_reference: str | None = None,
):
    if payment_method not in {"cash", "card", "upi", "online"}:
        raise ValueError("Unsupported payment method")

    if payment_amount <= Decimal("0.00"):
        raise ValueError("Payment amount must be greater than zero")

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT fine_id, amount, amount_paid
                FROM fines
                WHERE fine_id = %s
                FOR UPDATE
                """,
                (fine_id,),
            )
            fine = cursor.fetchone()

            if fine is None:
                return None

            outstanding = fine["amount"] - fine["amount_paid"]

            if payment_amount > outstanding:
                raise ValueError("Payment exceeds outstanding fine")

            cursor.execute(
                """
                INSERT INTO fine_payments (
                    fine_id,
                    amount,
                    payment_method,
                    payment_status,
                    transaction_reference,
                    confirmed_at
                )
                VALUES (%s, %s, %s, 'confirmed', %s, CURRENT_TIMESTAMP)
                RETURNING payment_id, fine_id, amount,
                          payment_method, payment_status,
                          transaction_reference, confirmed_at
                """,
                (
                    fine_id,
                    payment_amount,
                    payment_method,
                    transaction_reference,
                ),
            )
            payment = cursor.fetchone()

            new_amount_paid = fine["amount_paid"] + payment_amount
            new_status = (
                "paid"
                if new_amount_paid == fine["amount"]
                else "partial"
            )

            cursor.execute(
                """
                UPDATE fines
                SET amount_paid = %s,
                    payment_status = %s,
                    paid_at = CASE
                        WHEN %s = 'paid' THEN CURRENT_TIMESTAMP
                        ELSE NULL
                    END
                WHERE fine_id = %s
                """,
                (
                    new_amount_paid,
                    new_status,
                    new_status,
                    fine_id,
                ),
            )

            return payment
