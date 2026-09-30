from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class CustomerResponse(BaseModel):
    """
    Response returned when customer risk context
    is requested.
    """

    customer_id: str

    exists: bool

    profile: Optional[Dict[str, Any]] = None

    risk_context: Dict[str, Any] = Field(
        default_factory=dict
    )