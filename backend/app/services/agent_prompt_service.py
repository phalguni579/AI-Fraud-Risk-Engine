from typing import Any, Dict


class AgentPromptService:
    """
    Builds structured prompts for the Fraud Risk Agent.

    The prompt separates:
    - transaction data
    - ML output
    - deterministic rules
    - customer context
    - risk signals
    - policy decision
    """

    SYSTEM_PROMPT = """
You are a Fraud Risk Decision Agent.

Your responsibility is to investigate financial transactions
using the available transaction, customer, machine-learning,
business-rule, and risk-policy information.

You must:

1. Analyze the available evidence.
2. Never invent missing information.
3. Clearly distinguish model predictions from business rules.
4. Explain the major risk signals.
5. Follow the configured risk policy.
6. Produce a concise and auditable decision explanation.
7. Prefer REVIEW when evidence is insufficient.
8. Never override a mandatory BLOCK rule.

Possible final decisions:

- APPROVE
- REVIEW
- BLOCK

Your response must be structured and explain:
- decision
- risk level
- major reasons
- evidence used
- recommended next action
"""

    def build_prompt(
        self,
        investigation: Dict[str, Any],
    ) -> str:
        """
        Converts investigation data into a structured
        prompt that can be sent to an LLM.
        """

        customer_id = investigation.get(
            "customer_id",
            "UNKNOWN",
        )

        transaction = investigation.get(
            "transaction",
            {},
        )

        customer_profile = investigation.get(
            "customer_profile",
            {},
        )

        transaction_history = investigation.get(
            "transaction_history",
            {},
        )

        model_result = investigation.get(
            "model_result",
            {},
        )

        rules_result = investigation.get(
            "rules_result",
            {},
        )

        risk_signals = investigation.get(
            "risk_signals",
            {},
        )

        policy_result = investigation.get(
            "policy_result",
            {},
        )

        return f"""
{self.SYSTEM_PROMPT}

================ CUSTOMER =================

Customer ID:
{customer_id}

Customer Profile:
{customer_profile}


================ TRANSACTION ===============

{transaction}


================ TRANSACTION HISTORY ========

{transaction_history}


================ ML MODEL ==================

{model_result}


================ FRAUD RULES ================

{rules_result}


================ RISK SIGNALS ===============

{risk_signals}


================ RISK POLICY ================

{policy_result}


================ REQUIRED OUTPUT ============

Return a structured fraud-risk assessment containing:

Decision:
Risk Level:
Fraud Probability:
Key Reasons:
Evidence Considered:
Recommended Action:
"""

    def build_system_prompt(self) -> str:
        """
        Returns the system-level instructions separately.
        """

        return self.SYSTEM_PROMPT.strip()


agent_prompt_service = AgentPromptService()


def build_agent_prompt(
    investigation: Dict[str, Any],
) -> str:

    return agent_prompt_service.build_prompt(
        investigation
    )