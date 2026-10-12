from pydantic import BaseModel, ConfigDict, EmailStr, Field

class MemberRegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class MemberLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    member_id: int
    full_name: str
    email: EmailStr
    is_active: bool
