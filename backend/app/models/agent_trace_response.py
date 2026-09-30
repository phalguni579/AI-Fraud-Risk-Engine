from typing import Any, Dict, List

from pydantic import BaseModel, Field


class AgentTraceStep(BaseModel):
    """
    Represents one action performed during
    an agent investigation.
    """

    timestamp: str

    step: str

    tool: str

    status: str

    details: Dict[str, Any] = Field(
        default_factory=dict
    )


class AgentTraceResponse(BaseModel):
    """
    Complete investigation trace for a transaction.
    """

    transaction_id: str

    steps: List[AgentTraceStep] = Field(
        default_factory=list
    )

    total_steps: int