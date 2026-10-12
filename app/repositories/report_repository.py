
from app.db.connection import get_connection


def get_overdue_loans() -> list[dict]:
    sql = """
        SELECT
            l.loan_id,
            m.member_id,
            m.full_name AS member_name,
            m.email AS member_email,
            b.book_id,
            b.title AS book_title,
            bc.barcode,
            br.name AS branch_name,
            l.checkout_date,
            l.due_date,
            CURRENT_DATE - l.due_date::date AS overdue_days
        FROM loans l
        JOIN members m ON m.member_id = l.member_id
        JOIN book_copies bc ON bc.copy_id = l.copy_id
        JOIN books b ON b.book_id = bc.book_id
        JOIN branches br ON br.branch_id = bc.branch_id
        WHERE l.returned_at IS NULL
          AND l.due_date < CURRENT_TIMESTAMP
        ORDER BY l.due_date ASC
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return cursor.fetchall()


def get_most_borrowed_books(limit: int = 10) -> list[dict]:
    sql = """
        SELECT
            b.book_id,
            b.title,
            b.isbn,
            COUNT(l.loan_id) AS borrow_count,
            COUNT(l.loan_id) FILTER (
                WHERE l.returned_at IS NULL
            ) AS active_loan_count
        FROM books b
        JOIN book_copies bc ON bc.book_id = b.book_id
        JOIN loans l ON l.copy_id = bc.copy_id
        GROUP BY b.book_id, b.title, b.isbn
        ORDER BY borrow_count DESC, b.title ASC
        LIMIT %s
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (limit,))
            return cursor.fetchall()

def get_dashboard_stats() -> dict:
    sql = """
        SELECT
            (SELECT COUNT(*) FROM books) AS total_books,
            (SELECT COUNT(*) FROM members) AS total_members,
            (
                SELECT COUNT(*)
                FROM loans
                WHERE returned_at IS NULL
            ) AS active_loans,
            (
                SELECT COUNT(*)
                FROM loans
                WHERE returned_at IS NULL
                  AND due_date < CURRENT_TIMESTAMP
            ) AS overdue_loans
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return cursor.fetchone()
