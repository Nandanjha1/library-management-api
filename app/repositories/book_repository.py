from app.db.connection import get_connection

def list_books(
    search: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> dict:
    search_pattern = f"%{search.strip()}%" if search and search.strip() else None

    count_sql = """
        SELECT COUNT(*) AS total
        FROM books b
        WHERE (
            %s::text IS NULL
            OR b.title ILIKE %s
            OR b.isbn ILIKE %s
            OR b.publisher ILIKE %s
            OR EXISTS (
                SELECT 1
                FROM book_authors ba
                JOIN authors a ON a.author_id = ba.author_id
                WHERE ba.book_id = b.book_id
                  AND a.name ILIKE %s
            )
        )
    """

    books_sql = """
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.publisher,
            b.publication_year,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'author_id', a.author_id,
                            'name', a.name
                        )
                        ORDER BY a.name
                    )
                    FROM book_authors ba
                    JOIN authors a ON a.author_id = ba.author_id
                    WHERE ba.book_id = b.book_id
                ),
                '[]'::jsonb
            ) AS authors,
            COUNT(bc.copy_id) FILTER (
                WHERE bc.status = 'available'
            ) AS available_copies
        FROM books b
        LEFT JOIN book_copies bc ON bc.book_id = b.book_id
        WHERE (
            %s::text IS NULL
            OR b.title ILIKE %s
            OR b.isbn ILIKE %s
            OR b.publisher ILIKE %s
            OR EXISTS (
                SELECT 1
                FROM book_authors ba
                JOIN authors a ON a.author_id = ba.author_id
                WHERE ba.book_id = b.book_id
                  AND a.name ILIKE %s
            )
        )
        GROUP BY
            b.book_id,
            b.isbn,
            b.title,
            b.publisher,
            b.publication_year
        ORDER BY b.title, b.book_id
        LIMIT %s OFFSET %s
    """

    search_params = (
        search_pattern,
        search_pattern,
        search_pattern,
        search_pattern,
        search_pattern,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(count_sql, search_params)
            total = cursor.fetchone()["total"]

            cursor.execute(
                books_sql,
                (*search_params, limit, offset),
            )
            items = cursor.fetchall()

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_book_by_id(book_id: int) -> dict | None:
    book_sql = """
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.publisher,
            b.publication_year,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'author_id', a.author_id,
                            'name', a.name
                        )
                        ORDER BY a.name
                    )
                    FROM book_authors ba
                    JOIN authors a ON a.author_id = ba.author_id
                    WHERE ba.book_id = b.book_id
                ),
                '[]'::jsonb
            ) AS authors,
            COUNT(bc.copy_id) FILTER (
                WHERE bc.status = 'available'
            ) AS available_copies
        FROM books b
        LEFT JOIN book_copies bc ON bc.book_id = b.book_id
        WHERE b.book_id = %s
        GROUP BY
            b.book_id,
            b.isbn,
            b.title,
            b.publisher,
            b.publication_year
    """

    branch_sql = """
        SELECT
            br.branch_id,
            br.name AS branch_name,
            COUNT(bc.copy_id) FILTER (
                WHERE bc.status = 'available'
            ) AS available_copies
        FROM book_copies bc
        JOIN branches br ON br.branch_id = bc.branch_id
        WHERE bc.book_id = %s
        GROUP BY br.branch_id, br.name
        ORDER BY br.name
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(book_sql, (book_id,))
            book = cursor.fetchone()

            if book is None:
                return None

            cursor.execute(branch_sql, (book_id,))
            book["branch_availability"] = cursor.fetchall()

    return book


def create_book(
    *,
    isbn: str | None,
    title: str,
    publisher: str | None,
    publication_year: int | None,
    author_ids: list[int],
) -> int:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            # Remove duplicate author IDs
            unique_author_ids = list(dict.fromkeys(author_ids))

            # Validate author IDs before inserting the book
            if unique_author_ids:
                cursor.execute(
                    """
                    SELECT author_id
                    FROM authors
                    WHERE author_id = ANY(%s)
                    """,
                    (unique_author_ids,),
                )

                found_ids = {
                    row["author_id"] for row in cursor.fetchall()
                }

                if found_ids != set(unique_author_ids):
                    raise ValueError(
                        "One or more author IDs do not exist"
                    )

            # Insert the book
            cursor.execute(
                """
                INSERT INTO books (
                    isbn,
                    title,
                    publisher,
                    publication_year
                )
                VALUES (%s, %s, %s, %s)
                RETURNING book_id
                """,
                (
                    isbn,
                    title.strip(),
                    publisher,
                    publication_year,
                ),
            )

            book_id = cursor.fetchone()["book_id"]

            # Link authors with the newly created book
            for author_id in unique_author_ids:
                cursor.execute(
                    """
                    INSERT INTO book_authors (book_id, author_id)
                    VALUES (%s, %s)
                    """,
                    (book_id, author_id),
                )

    return book_id



def update_book(
    book_id: int,
    *,
    isbn: str | None,
    title: str | None,
    publisher: str | None,
    publication_year: int | None,
    author_ids: list[int] | None,
) -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT book_id
                FROM books
                WHERE book_id = %s
                FOR UPDATE
                """,
                (book_id,),
            )

            if cursor.fetchone() is None:
                return False

            updates = []
            params = []

            if isbn is not None:
                updates.append("isbn = %s")
                params.append(isbn)

            if title is not None:
                updates.append("title = %s")
                params.append(title.strip())

            if publisher is not None:
                updates.append("publisher = %s")
                params.append(publisher)

            if publication_year is not None:
                updates.append("publication_year = %s")
                params.append(publication_year)

            if updates:
                params.append(book_id)
                cursor.execute(
                    f"""
                    UPDATE books
                    SET {", ".join(updates)}
                    WHERE book_id = %s
                    """,
                    tuple(params),
                )

            if author_ids is not None:
                unique_author_ids = list(dict.fromkeys(author_ids))

                if unique_author_ids:
                    cursor.execute(
                        """
                        SELECT author_id
                        FROM authors
                        WHERE author_id = ANY(%s)
                        """,
                        (unique_author_ids,),
                    )

                    found_ids = {
                        row["author_id"] for row in cursor.fetchall()
                    }

                    if found_ids != set(unique_author_ids):
                        raise ValueError("One or more author IDs do not exist")

                cursor.execute(
                    "DELETE FROM book_authors WHERE book_id = %s",
                    (book_id,),
                )

                for author_id in unique_author_ids:
                    cursor.execute(
                        """
                        INSERT INTO book_authors (book_id, author_id)
                        VALUES (%s, %s)
                        """,
                        (book_id, author_id),
                    )

    return True

def add_book_copies(
    *,
    book_id: int,
    branch_id: int,
    barcodes: list[str],
) -> list[dict]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            # Verify that the book exists
            cursor.execute(
                "SELECT book_id FROM books WHERE book_id = %s",
                (book_id,),
            )

            if cursor.fetchone() is None:
                raise LookupError("Book not found")

            # Verify that the branch exists
            cursor.execute(
                "SELECT branch_id FROM branches WHERE branch_id = %s",
                (branch_id,),
            )

            if cursor.fetchone() is None:
                raise LookupError("Branch not found")

            created_copies = []

            for barcode in barcodes:
                cursor.execute(
                    """
                    INSERT INTO book_copies (
                        book_id,
                        branch_id,
                        barcode
                    )
                    VALUES (%s, %s, %s)
                    RETURNING copy_id, book_id, branch_id, barcode, status
                    """,
                    (book_id, branch_id, barcode.strip()),
                )

                created_copies.append(cursor.fetchone())

    return created_copies
