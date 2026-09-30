from typing import Dict


class RiskEngine:
    """
    Converts fraud model output into a business risk decision.
    """

    def __init__(
        self,
        low_threshold: float = 0.30,
        high_threshold: float = 0.70,
    ):
        self.low_threshold = low_threshold
        self.high_threshold = high_threshold

    def calculate_risk(
        self,
        fraud_probability: float,
    ) -> Dict:

        probability = max(
            0.0,
            min(1.0, fraud_probability)
        )

        risk_score = round(
            probability * 100,
            2
        )

        if probability >= self.high_threshold:
            risk_level = "HIGH"
            decision = "BLOCK"

        elif probability >= self.low_threshold:
            risk_level = "MEDIUM"
            decision = "REVIEW"

        else:
            risk_level = "LOW"
            decision = "APPROVE"

        return {
            "fraud_probability": round(
                probability,
                4
            ),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "decision": decision,
        }


def evaluate_transaction(
    fraud_probability: float,
) -> Dict:
    """
    Convenience function for evaluating
    a transaction's risk.
    """

    engine = RiskEngine()

    return engine.calculate_risk(
        fraud_probability
    )


if __name__ == "__main__":

    test_probability = 0.82

    result = evaluate_transaction(
        test_probability
    )

    print("\nRisk Engine Result")
    print("==================")

    for key, value in result.items():
        print(
            f"{key}: {value}"
        )