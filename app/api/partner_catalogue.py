
from fastapi import APIRouter, Depends, Query
import psycopg

from app.core.partner_dependencies import get_authenticated_partner
from app.repositories.book_repository import list_books

router = APIRouter(
    prefix="/partner/catalogue",
    tags=["Partner Catalogue"],
)


@router.get("/books")
def partner_list_books(
    search: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    partner: dict = Depends(get_authenticated_partner),
):
    try:
        result = list_books(
            search=search,
            limit=limit,
            offset=offset,
        )
    except psycopg.Error:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to retrieve catalogue",
            },
        )

    return {
        "partner": partner["partner_name"],
        "catalogue": result,
    }
