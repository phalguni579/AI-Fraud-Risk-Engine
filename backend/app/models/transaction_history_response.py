from typing import Any, Dict, List

from pydantic import BaseModel, Field


class TransactionHistoryResponse(BaseModel):
    """
    Response containing a customer's recent
    transaction history.
    """

    customer_id: str

    transaction_count: int

    transactions: List[
        Dict[str, Any]
    ] = Field(
        default_factory=list
    )