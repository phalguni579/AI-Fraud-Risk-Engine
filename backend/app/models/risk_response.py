from typing import List

from pydantic import BaseModel, Field


class RiskResponse(BaseModel):
    """
    Standard response returned by the risk engine.
    """

    fraud_probability: float = Field(
        ...,
        ge=0,
        le=1,
    )

    risk_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    risk_level: str

    decision: str

    reasons: List[str] = Field(
        default_factory=list
    )

    recommendation: str