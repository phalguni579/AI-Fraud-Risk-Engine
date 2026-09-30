from typing import Any, Dict

from pydantic import BaseModel, Field


class ModelPerformanceResponse(BaseModel):
    """
    Response containing fraud-model performance metrics.
    """

    status: str

    metrics: Dict[str, Any] = Field(
        default_factory=dict
    )