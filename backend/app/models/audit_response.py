from typing import Any, Dict, List

from pydantic import BaseModel, Field


class AuditEventResponse(BaseModel):
    """
    Represents one recorded fraud-risk decision event.
    """

    transaction_id: str

    timestamp: str

    decision: str

    risk_level: str

    fraud_probability: float


class AuditEventsResponse(BaseModel):
    """
    Collection of recorded audit events.
    """

    total_events: int

    events: List[
        Dict[str, Any]
    ] = Field(
        default_factory=list
    )