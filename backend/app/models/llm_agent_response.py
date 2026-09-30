from typing import Any, Dict

from pydantic import BaseModel, Field


class LLMAgentResponse(BaseModel):
    """
    Structured response returned by the AI Risk Agent.
    """

    agent: str

    customer_id: str

    investigation: Dict[str, Any]

    ai_assessment: Dict[str, Any] = Field(
        default_factory=dict
    )

    status: str