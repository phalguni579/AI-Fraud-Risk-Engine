from pydantic import BaseModel, Field


class Transaction(BaseModel):
    """
    Input schema for a financial transaction.
    """

    amount: float = Field(
        ...,
        gt=0,
        description="Transaction amount",
    )

    hour: int = Field(
        ...,
        ge=0,
        le=23,
        description="Hour when transaction occurred",
    )

    distance_from_home: float = Field(
        ...,
        ge=0,
        description="Distance from customer's usual location",
    )

    failed_attempts: int = Field(
        default=0,
        ge=0,
        description="Number of failed transaction attempts",
    )

    account_age_days: int = Field(
        ...,
        ge=0,
        description="Age of customer account in days",
    )

    merchant_risk: float = Field(
        ...,
        ge=0,
        le=1,
        description="Merchant risk score",
    )

    transactions_24h: int = Field(
        default=0,
        ge=0,
        description="Number of transactions in the last 24 hours",
    )

    transactions_1h: int = Field(
        default=0,
        ge=0,
        description="Number of transactions in the last hour",
    )

    average_transaction_amount: float = Field(
        ...,
        gt=0,
        description="Customer's average transaction amount",
    )

    international_transaction: int = Field(
        default=0,
        ge=0,
        le=1,
        description="Whether the transaction is international",
    )

    new_device: int = Field(
        default=0,
        ge=0,
        le=1,
        description="Whether the transaction uses a new device",
    )

    device_age_days: int = Field(
        default=0,
        ge=0,
        description="Age of the device in days",
    )