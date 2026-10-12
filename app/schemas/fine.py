from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class FinePaymentRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)

class FineResponse(BaseModel):
    fine_id: int
    loan_id: int
    amount: Decimal
    amount_paid: Decimal
    payment_status: str
    created_at: datetime
    paid_at: datetime | None
