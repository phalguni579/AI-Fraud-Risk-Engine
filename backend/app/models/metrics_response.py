from typing import Any, Dict

from pydantic import BaseModel, Field


class MetricsResponse(BaseModel):
    """
    Operational metrics returned by the monitoring layer.
    """

    total_predictions: int

    average_probability: float

    minimum_probability: float

    maximum_probability: float

    high_risk_predictions: int

    high_risk_rate: float

    blocked_predictions: int

    block_rate: float

    additional_metrics: Dict[str, Any] = Field(
        default_factory=dict
    )