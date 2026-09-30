from typing import Optional

from pydantic import BaseModel, Field


class Customer(BaseModel):
    """
    Customer profile used by the fraud-risk engine.
    """

    customer_id: str = Field(
        ...,
        min_length=1,
    )

    account_age_days: int = Field(
        default=0,
        ge=0,
    )

    average_transaction_amount: float = Field(
        default=0,
        ge=0,
    )

    usual_country: str = Field(
        default="UNKNOWN",
    )

    usual_device_count: int = Field(
        default=0,
        ge=0,
    )

    risk_rating: Optional[str] = None