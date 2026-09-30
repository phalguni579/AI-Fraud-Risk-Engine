from typing import Dict, List


class ExplanationService:
    """
    Generates human-readable explanations for
    why a transaction received a particular risk level.
    """

    def explain(
        self,
        transaction: Dict,
        prediction: Dict,
        risk_result: Dict,
    ) -> Dict:

        reasons: List[Dict] = []

        fraud_probability = prediction.get(
            "fraud_probability",
            0.0,
        )

        amount = transaction.get(
            "amount",
            0,
        )

        average_amount = transaction.get(
            "average_transaction_amount",
            0,
        )

        if transaction.get("new_device") == 1:
            reasons.append({
                "feature": "new_device",
                "impact": "HIGH",
                "explanation": (
                    "The transaction originated from a "
                    "device that is new for this customer."
                ),
            })

        if transaction.get("international_transaction") == 1:
            reasons.append({
                "feature": "international_transaction",
                "impact": "MEDIUM",
                "explanation": (
                    "The transaction is international, "
                    "which increases contextual risk."
                ),
            })

        if transaction.get("failed_attempts", 0) >= 2:
            reasons.append({
                "feature": "failed_attempts",
                "impact": "HIGH",
                "explanation": (
                    "Multiple failed attempts were detected "
                    "before the transaction."
                ),
            })

        if transaction.get("distance_from_home", 0) >= 100:
            reasons.append({
                "feature": "distance_from_home",
                "impact": "MEDIUM",
                "explanation": (
                    "The transaction occurred significantly "
                    "far from the customer's usual location."
                ),
            })

        if transaction.get("merchant_risk", 0) >= 0.7:
            reasons.append({
                "feature": "merchant_risk",
                "impact": "HIGH",
                "explanation": (
                    "The merchant has an elevated risk score."
                ),
            })

        if (
            average_amount > 0
            and amount > average_amount * 2
        ):
            reasons.append({
                "feature": "transaction_amount",
                "impact": "HIGH",
                "explanation": (
                    "The transaction amount is significantly "
                    "higher than the customer's average amount."
                ),
            })

        if transaction.get("hour", 12) <= 4:
            reasons.append({
                "feature": "transaction_hour",
                "impact": "MEDIUM",
                "explanation": (
                    "The transaction occurred during "
                    "a high-risk late-night period."
                ),
            })

        return {
            "fraud_probability": fraud_probability,
            "risk_level": risk_result.get(
                "risk_level",
                "UNKNOWN",
            ),
            "decision": risk_result.get(
                "decision",
                "REVIEW",
            ),
            "reasons": reasons,
            "reason_count": len(reasons),
        }


def explain_transaction(
    transaction: Dict,
    prediction: Dict,
    risk_result: Dict,
) -> Dict:
    """
    Convenience function for generating
    transaction explanations.
    """

    service = ExplanationService()

    return service.explain(
        transaction=transaction,
        prediction=prediction,
        risk_result=risk_result,
    )