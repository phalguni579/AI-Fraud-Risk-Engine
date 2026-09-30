from pydantic import BaseModel, Field

from backend.app.models.transaction import Transaction


class DecisionRequest(BaseModel):
    """
    Request payload for the complete fraud-risk
    decision pipeline.
    """

    customer_id: str = Field(
        default="anonymous",
        min_length=1,
    )

    transaction: Transaction