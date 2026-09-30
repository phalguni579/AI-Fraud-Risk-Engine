from typing import Any, Dict

from backend.app.services.agent_decision_service import (
    investigate_transaction,
)
from backend.app.services.llm_service import (
    generate_ai_assessment,
)


class LLMRiskAgent:
    """
    AI-powered fraud investigation agent.

    The agent first gathers deterministic evidence
    through the existing risk tools and then prepares
    that evidence for an LLM assessment.
    """

    def __init__(self):
        self.agent_name = (
            "AI Fraud Risk Investigation Agent"
        )

    def investigate(
        self,
        customer_id: str,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        investigation = investigate_transaction(
            customer_id=customer_id,
            transaction=transaction,
        )

        ai_assessment = generate_ai_assessment(
            investigation
        )

        return {
            "agent": self.agent_name,
            "customer_id": customer_id,
            "investigation": investigation,
            "ai_assessment": ai_assessment,
            "status": "completed",
        }


llm_risk_agent = LLMRiskAgent()


def run_llm_risk_agent(
    customer_id: str,
    transaction: Dict[str, Any],
) -> Dict[str, Any]:

    return llm_risk_agent.investigate(
        customer_id=customer_id,
        transaction=transaction,
    )