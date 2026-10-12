import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.librarian_dependencies import get_current_librarian
from app.repositories.report_repository import (
    get_most_borrowed_books,
    get_overdue_loans,
)
from app.repositories.report_repository import get_dashboard_stats

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/dashboard-stats")
def dashboard_stats(
    librarian=Depends(get_current_librarian),
):
    return get_dashboard_stats()

@router.get("/overdue")
def overdue_report(
    librarian: dict = Depends(get_current_librarian),
):
    try:
        return {"items": get_overdue_loans()}
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to generate overdue report",
            },
        )


@router.get("/most-borrowed")
def most_borrowed_report(
    limit: int = Query(default=10, ge=1, le=100),
    librarian: dict = Depends(get_current_librarian),
):
    try:
        return {
            "items": get_most_borrowed_books(limit=limit)
        }
    except psycopg.Error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to generate borrowing report",
            },
        )
