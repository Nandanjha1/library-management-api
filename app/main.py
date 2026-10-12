import psycopg
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.connection import get_connection
from app.api.books import router as books_router
from app.api.auth import router as auth_router
from app.api.members import router as members_router
from app.api.librarian_auth import router as librarian_auth_router
from app.api.partner_catalogue import router as partner_router
from app.api.loans import router as loans_router
from app.api.member_loans import router as member_loans_router
from app.api.fines import router as fines_router
from app.api.reports import router as reports_router

app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for managing library books, "
        "members, loans, and fines."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books_router)
app.include_router(auth_router)
app.include_router(members_router)
app.include_router(librarian_auth_router)
app.include_router(partner_router)
app.include_router(loans_router)
app.include_router(member_loans_router)
app.include_router(fines_router)
app.include_router(reports_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "message": "Library Management API is running",
    }


@app.get("/health/db", tags=["Health"])
def database_health_check():
    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT current_database() AS database_name"
                )
                result = cursor.fetchone()

        return {
            "status": "ok",
            "database": result["database_name"],
            "message": "Database connection successful",
        }

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Unable to connect to the database",
            },
        )
