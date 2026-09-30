from typing import Any, Dict, List

from pydantic import BaseModel, Field


class AgentDecisionResponse(BaseModel):
    """
    Structured response returned by the agent investigation layer.
    """

    customer_id: str

    transaction: Dict[str, Any]

    customer_profile: Dict[str, Any]

    transaction_history: Dict[str, Any]

    model_result: Dict[str, Any]

    rules_result: Dict[str, Any]

    risk_signals: Dict[str, Any]

    policy_result: Dict[str, Any]

    reasoning: List[str] = Field(
        default_factory=list
    )

    tools_used: List[str] = Field(
        default_factory=list
    )