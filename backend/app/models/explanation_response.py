from typing import List

from pydantic import BaseModel


class ExplanationReason(BaseModel):
    """
    Explains why a transaction received a risk signal.
    """

    feature: str
    impact: str
    explanation: str


class ExplanationResponse(BaseModel):
    """
    Structured explanation of a fraud-risk decision.
    """

    fraud_probability: float
    risk_level: str
    decision: str
    reasons: List[ExplanationReason]
    reason_count: int