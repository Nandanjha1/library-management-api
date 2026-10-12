from fastapi import APIRouter, HTTPException, Query, status, Depends
import psycopg
from app.repositories.book_repository import (
    get_book_by_id,
    list_books,
    create_book,
    update_book,
    add_book_copies,
)
from app.schemas.book import (
    BookDetailResponse,
    BookListResponse,
    BookCreateRequest,
    BookUpdateRequest,
    AddBookCopiesRequest,
)
from app.core.librarian_dependencies import get_current_librarian


router = APIRouter(prefix="/books", tags=["Books"])

@router.get("", response_model=BookListResponse)
def read_books(
    search: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    try:
        return list_books(
            search=search,
            limit=limit,
            offset=offset,
        )
    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to retrieve books right now",
            },
        )


@router.get(
    "/{book_id}",
    response_model=BookDetailResponse,
)
def read_book(book_id: int):
    try:
        book = get_book_by_id(book_id)

        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "BOOK_NOT_FOUND",
                    "message": f"Book with ID {book_id} was not found",
                },
            )

        return book

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to retrieve book details right now",
            },
        )

@router.post("", status_code=status.HTTP_201_CREATED)
def create_book_endpoint(
    payload: BookCreateRequest,
    current_librarian: dict = Depends(get_current_librarian),
):
    try:
        book_id = create_book(
            isbn=payload.isbn,
            title=payload.title,
            publisher=payload.publisher,
            publication_year=payload.publication_year,
            author_ids=payload.author_ids,
        )

        return {
            "message": "Book created successfully",
            "book_id": book_id,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_AUTHOR_IDS",
                "message": str(exc),
            },
        )

    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "BOOK_ALREADY_EXISTS",
                "message": "A book with this unique ISBN already exists",
            },
        )

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to create book right now",
            },
        )

@router.patch("/{book_id}")
def update_book_endpoint(
    book_id: int,
    payload: BookUpdateRequest,
    current_librarian: dict = Depends(get_current_librarian),
):
    if not payload.model_fields_set:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "EMPTY_UPDATE",
                "message": "Provide at least one field to update",
            },
        )

    try:
        updated = update_book(
            book_id,
            isbn=payload.isbn,
            title=payload.title,
            publisher=payload.publisher,
            publication_year=payload.publication_year,
            author_ids=payload.author_ids,
        )

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "BOOK_NOT_FOUND",
                    "message": f"Book with ID {book_id} was not found",
                },
            )

        return {
            "message": "Book updated successfully",
            "book_id": book_id,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_AUTHOR_IDS",
                "message": str(exc),
            },
        )

    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_BOOK",
                "message": "The updated book conflicts with an existing unique value",
            },
        )

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to update book right now",
            },
        )


@router.post("/{book_id}/copies", status_code=status.HTTP_201_CREATED)
def add_book_copies_endpoint(
    book_id: int,
    payload: AddBookCopiesRequest,
    current_librarian: dict = Depends(get_current_librarian),
):
    try:
        copies = add_book_copies(
            book_id=book_id,
            branch_id=payload.branch_id,
            barcodes=payload.barcodes,
        )

        return {
            "message": "Book copies added successfully",
            "count": len(copies),
            "copies": copies,
        }

    except LookupError as exc:
        message = str(exc)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "RESOURCE_NOT_FOUND",
                "message": message,
            },
        )

    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_BARCODE",
                "message": "One or more barcodes already exist",
            },
        )

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to add book copies right now",
            },
        )
