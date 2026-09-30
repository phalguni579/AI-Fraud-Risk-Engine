from typing import Dict, List


class RiskAgent:
    """
    Agent responsible for combining transaction signals,
    model predictions, and business rules into a final
    fraud-risk recommendation.
    """

    def __init__(self):
        self.agent_name = "Fraud Risk Decision Agent"

    def analyze(
        self,
        transaction: Dict,
        prediction: Dict,
        risk_result: Dict,
    ) -> Dict:

        fraud_probability = prediction.get(
            "fraud_probability",
            0.0
        )

        risk_level = risk_result.get(
            "risk_level",
            "UNKNOWN"
        )

        decision = risk_result.get(
            "decision",
            "REVIEW"
        )

        reasons: List[str] = []

        # Transaction-level risk signals
        if transaction.get("new_device") == 1:
            reasons.append(
                "Transaction originated from a new device."
            )

        if transaction.get("international_transaction") == 1:
            reasons.append(
                "Transaction is international."
            )

        if transaction.get("failed_attempts", 0) >= 2:
            reasons.append(
                "Multiple failed attempts were detected."
            )

        if transaction.get("distance_from_home", 0) >= 100:
            reasons.append(
                "Transaction occurred far from the usual location."
            )

        if transaction.get("merchant_risk", 0) >= 0.7:
            reasons.append(
                "Merchant risk score is elevated."
            )

        if transaction.get("amount", 0) > (
            transaction.get(
                "average_transaction_amount",
                0
            ) * 2
        ):
            reasons.append(
                "Transaction amount is significantly higher than the customer's average."
            )

        # Agent recommendation
        if risk_level == "HIGH":
            recommendation = (
                "Block the transaction and initiate fraud investigation."
            )

        elif risk_level == "MEDIUM":
            recommendation = (
                "Send the transaction for manual review or additional verification."
            )

        else:
            recommendation = (
                "Approve the transaction and continue monitoring."
            )

        return {
            "agent": self.agent_name,
            "fraud_probability": fraud_probability,
            "risk_level": risk_level,
            "decision": decision,
            "reasons": reasons,
            "recommendation": recommendation,
        }


def run_risk_agent(
    transaction: Dict,
    prediction: Dict,
    risk_result: Dict,
) -> Dict:
    """
    Convenience function for running the risk agent.
    """

    agent = RiskAgent()

    return agent.analyze(
        transaction=transaction,
        prediction=prediction,
        risk_result=risk_result,
    )