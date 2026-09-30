from typing import Any, Dict


class RiskPolicyService:
    """
    Converts model, rule, and contextual signals
    into a final business risk policy decision.
    """

    def evaluate(
        self,
        fraud_probability: float,
        rule_decision: str,
        new_device: int = 0,
        international_transaction: int = 0,
    ) -> Dict[str, Any]:

        policy_flags = []

        if new_device == 1:
            policy_flags.append(
                "NEW_DEVICE"
            )

        if international_transaction == 1:
            policy_flags.append(
                "INTERNATIONAL_TRANSACTION"
            )

        if rule_decision == "BLOCK":
            final_decision = "BLOCK"
            policy_reason = (
                "A high-severity business rule "
                "requires the transaction to be blocked."
            )

        elif fraud_probability >= 0.70:
            final_decision = "BLOCK"
            policy_reason = (
                "The model fraud probability exceeds "
                "the high-risk threshold."
            )

        elif (
            fraud_probability >= 0.30
            or rule_decision == "REVIEW"
        ):
            final_decision = "REVIEW"
            policy_reason = (
                "The transaction contains sufficient "
                "risk signals to require additional review."
            )

        else:
            final_decision = "APPROVE"
            policy_reason = (
                "The transaction remains below the "
                "configured risk thresholds."
            )

        return {
            "final_decision": final_decision,
            "policy_reason": policy_reason,
            "policy_flags": policy_flags,
            "policy_version": "1.0",
        }


risk_policy_service = RiskPolicyService()


def evaluate_risk_policy(
    fraud_probability: float,
    rule_decision: str,
    new_device: int = 0,
    international_transaction: int = 0,
) -> Dict[str, Any]:

    return risk_policy_service.evaluate(
        fraud_probability=fraud_probability,
        rule_decision=rule_decision,
        new_device=new_device,
        international_transaction=international_transaction,
    )