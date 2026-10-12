from pydantic import BaseModel, ConfigDict, Field, field_validator

class AuthorResponse(BaseModel):
    author_id: int
    name: str

class BranchAvailability(BaseModel):
    branch_id: int
    branch_name: str
    available_copies: int = Field(ge=0)

class BookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    book_id: int
    isbn: str | None
    title: str
    publisher: str | None
    publication_year: int | None
    authors: list[AuthorResponse]
    available_copies: int = Field(ge=0)

class BookDetailResponse(BookResponse):
    branch_availability: list[BranchAvailability]

class BookListResponse(BaseModel):
    items: list[BookResponse]
    total: int
    limit: int
    offset: int

class BookCreateRequest(BaseModel):
    isbn: str | None = Field(default=None, max_length=20)
    title: str = Field(min_length=1, max_length=255)
    publisher: str | None = Field(default=None, max_length=255)
    publication_year: int | None = Field(default=None, ge=1, le=2100)
    author_ids: list[int] = Field(default_factory=list)

class BookUpdateRequest(BaseModel):
    isbn: str | None = Field(default=None, max_length=20)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    publisher: str | None = Field(default=None, max_length=255)
    publication_year: int | None = Field(default=None, ge=1, le=2100)
    author_ids: list[int] | None = None


class AddBookCopiesRequest(BaseModel):
    branch_id: int = Field(gt=0)
    barcodes: list[str] = Field(min_length=1, max_length=100)

    @field_validator("barcodes")
    @classmethod
    def validate_barcodes(cls, barcodes: list[str]) -> list[str]:
        cleaned = [barcode.strip() for barcode in barcodes]
        if any(not barcode or len(barcode) > 50 for barcode in cleaned):
            raise ValueError("Barcodes must contain 1 to 50 characters")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Duplicate barcodes are not allowed")

        return cleaned
