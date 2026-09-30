from typing import Any, Dict

from pydantic import BaseModel, Field


class ModelHealthResponse(BaseModel):
    """
    Model health and prediction statistics.
    """

    status: str

    statistics: Dict[str, Any] = Field(
        default_factory=dict
    )


class DriftResponse(BaseModel):
    """
    Model prediction drift information.
    """

    drift_detected: bool

    drift_score: float

    message: str

    baseline_mean: float | None = None

    current_mean: float | None = None


class RiskDistributionResponse(BaseModel):
    """
    Distribution of predictions across risk levels.
    """

    low: int

    medium: int

    high: int