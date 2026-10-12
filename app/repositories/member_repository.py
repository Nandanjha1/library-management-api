
from app.db.connection import get_connection


def create_member(
    full_name: str,
    email: str,
    password_hash: str,
) -> dict:
    sql = """
        INSERT INTO members (full_name, email, password_hash)
        VALUES (%s, %s, %s)
        RETURNING member_id, full_name, email, is_active
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                sql,
                (full_name, email, password_hash),
            )
            return cursor.fetchone()


def get_member_by_email(email: str) -> dict | None:
    sql = """
        SELECT
            member_id,
            full_name,
            email,
            password_hash,
            is_active
        FROM members
        WHERE email = %s
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (email,))
            return cursor.fetchone()


def get_member_by_id(member_id: int) -> dict | None:
    sql = """
        SELECT member_id, full_name, email, is_active
        FROM members
        WHERE member_id = %s
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (member_id,))
            return cursor.fetchone()



def get_staff_by_email(email: str) -> dict | None:
    sql = """
        SELECT
            staff_id,
            full_name,
            email,
            password_hash,
            is_active
        FROM staff
        WHERE email = %s
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, (email,))
            return cursor.fetchone()


def get_all_members() -> list[dict]:
    sql = """
        SELECT
            member_id,
            full_name,
            email,
            is_active
        FROM members
        ORDER BY member_id DESC
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return cursor.fetchall()
