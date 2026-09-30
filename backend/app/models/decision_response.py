from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DecisionResponse(BaseModel):
    transaction_id: str

    customer_id: str

    transaction: Dict[str, Any]

    prediction: Dict[str, Any]

    risk: Dict[str, Any]

    rules: Dict[str, Any]

    final_decision: str

    policy_result: Dict[str, Any]

    explanation: Dict[str, Any]

    shap: Optional[Dict[str, Any]] = None

    agent: Dict[str, Any]

    monitoring: Dict[str, Any]

    agent_trace: List[Dict[str, Any]] = Field(
        default_factory=list
    )

    audit: Dict[str, Any]
