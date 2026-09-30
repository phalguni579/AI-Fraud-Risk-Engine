from typing import Any, Dict, List

from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    """
    High-level fraud-risk dashboard summary.
    """

    total_transactions: int = 0

    high_risk_transactions: int = 0

    review_transactions: int = 0

    blocked_transactions: int = 0

    approved_transactions: int = 0

    average_fraud_probability: float = 0.0


class DashboardResponse(BaseModel):
    """
    Complete dashboard payload for the frontend.
    """

    summary: DashboardSummary

    risk_distribution: Dict[str, int] = Field(
        default_factory=dict
    )

    recent_transactions: List[
        Dict[str, Any]
    ] = Field(
        default_factory=list
    )

    model_health: Dict[str, Any] = Field(
        default_factory=dict
    )

    model_performance: Dict[str, Any] = Field(
        default_factory=dict
    )

    system_status: Dict[str, Any] = Field(
        default_factory=dict
    )