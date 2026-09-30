from typing import Any, Dict, List

from backend.app.services.agent_context_service import (
    build_agent_context,
)
from backend.app.services.agent_tool_registry import (
    agent_tool_registry,
)
from backend.app.services.risk_policy_service import (
    evaluate_risk_policy,
)


class AgentDecisionService:
    """
    Orchestrates the tools available to the Fraud Risk Agent
    and converts their outputs into an agent-ready decision.

    This is the deterministic foundation that we will later
    connect to an LLM for actual tool-calling.
    """

    def investigate(
        self,
        customer_id: str,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        context = build_agent_context(
            customer_id=customer_id,
            transaction=transaction,
        )

        model_result = (
            agent_tool_registry.execute(
                "run_fraud_model",
                transaction=transaction,
            )
        )

        rules_result = (
            agent_tool_registry.execute(
                "evaluate_fraud_rules",
                transaction=transaction,
            )
        )

        risk_signals = (
            agent_tool_registry.execute(
                "get_risk_signals",
                transaction=transaction,
            )
        )

        customer_profile = (
            agent_tool_registry.execute(
                "get_customer_profile",
                customer_id=customer_id,
            )
        )

        transaction_history = (
            agent_tool_registry.execute(
                "get_transaction_history",
                customer_id=customer_id,
                limit=10,
            )
        )

        fraud_probability = model_result.get(
            "fraud_probability",
            0.0,
        )

        rule_decision = rules_result.get(
            "rule_decision",
            "NO_ACTION",
        )

        policy_result = evaluate_risk_policy(
            fraud_probability=fraud_probability,
            rule_decision=rule_decision,
            new_device=transaction.get(
                "new_device",
                0,
            ),
            international_transaction=transaction.get(
                "international_transaction",
                0,
            ),
        )

        reasoning = self._build_reasoning(
            fraud_probability=fraud_probability,
            rules_result=rules_result,
            risk_signals=risk_signals,
            policy_result=policy_result,
        )

        return {
            "customer_id": customer_id,
            "transaction": transaction,
            "customer_profile": customer_profile,
            "transaction_history": transaction_history,
            "model_result": model_result,
            "rules_result": rules_result,
            "risk_signals": risk_signals,
            "policy_result": policy_result,
            "reasoning": reasoning,
            "tools_used": [
                "get_customer_profile",
                "get_transaction_history",
                "run_fraud_model",
                "evaluate_fraud_rules",
                "get_risk_signals",
            ],
        }

    @staticmethod
    def _build_reasoning(
        fraud_probability: float,
        rules_result: Dict[str, Any],
        risk_signals: Dict[str, Any],
        policy_result: Dict[str, Any],
    ) -> List[str]:

        reasoning = []

        reasoning.append(
            "Fraud model probability: "
            f"{fraud_probability:.2%}"
        )

        if risk_signals.get(
            "signals"
        ):
            reasoning.append(
                "Risk signals detected: "
                + ", ".join(
                    risk_signals["signals"]
                )
            )

        if rules_result.get(
            "rules_triggered"
        ):
            reasoning.append(
                "Business fraud rules were triggered."
            )
        else:
            reasoning.append(
                "No deterministic fraud rules were triggered."
            )

        reasoning.append(
            "Final policy decision: "
            + policy_result.get(
                "final_decision",
                "UNKNOWN",
            )
        )

        reasoning.append(
            policy_result.get(
                "policy_reason",
                "No policy explanation available.",
            )
        )

        return reasoning


agent_decision_service = (
    AgentDecisionService()
)


def investigate_transaction(
    customer_id: str,
    transaction: Dict[str, Any],
) -> Dict[str, Any]:

    return agent_decision_service.investigate(
        customer_id=customer_id,
        transaction=transaction,
    )