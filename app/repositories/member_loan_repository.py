
from app.db.connection import get_connection


def get_member_loans(member_id: int) -> list[dict]:
    sql = """
        SELECT
            l.loan_id,
            l.copy_id,
            b.book_id,
            b.title,
            bc.barcode,
            br.name AS branch_name,
            l.checkout_date,
            l.due_date,
            l.returned_at,
            CASE
                WHEN l.returned_at IS NULL
                     AND l.due_date < CURRENT_TIMESTAMP
                THEN TRUE
                ELSE FALSE
            END AS is_overdue
        FROM loans l
        JOIN book_copies bc ON bc.copy_id = l.copy_id
        JOIN books b ON b.book_id = bc.book_id
        JOIN branches br ON br.branch_id = bc.branch_id
        WHERE l.member_id = %s
        ORDER BY l.checkout_date DESC, l.loan_id DESC
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (member_id,))
            return cursor.fetchall()
