
from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_member
from app.core.librarian_dependencies import get_current_librarian
from app.repositories.member_repository import get_all_members
from app.schemas.auth import MemberResponse

router = APIRouter(prefix="/members", tags=["Members"])


@router.get("/me", response_model=MemberResponse)
def read_my_profile(
    current_member: dict = Depends(get_current_member),
):
    return current_member


@router.get("")
def list_members(
    current_librarian: dict = Depends(get_current_librarian),
):
    return get_all_members()
