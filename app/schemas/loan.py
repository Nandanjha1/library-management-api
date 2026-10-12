from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class CheckoutRequest(BaseModel):
    member_id: int = Field(gt=0)
    copy_id: int = Field(gt=0)
    due_date: datetime

class LoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    loan_id: int
    member_id: int
    copy_id: int
    checked_out_by: int
    checkout_date: datetime
    due_date: datetime
    returned_at: datetime | None = None

class ReturnResponse(BaseModel):
    loan_id: int
    returned_at: datetime
    overdue_days: int
    fine_amount: float
    message: str
