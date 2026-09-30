from typing import Any, Dict

from backend.app.services.monitoring_service import (
    monitoring_service,
)
from backend.app.services.risk_engine import (
    evaluate_transaction,
)
from ml.predict import predict_transaction


class TransactionService:
    """
    Coordinates ML prediction, risk evaluation,
    and model monitoring for a transaction.
    """

    def analyze_transaction(
        self,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        prediction = predict_transaction(
            transaction
        )

        fraud_probability = prediction.get(
            "fraud_probability",
            0.0,
        )

        is_fraud = prediction.get(
            "is_fraud",
            0,
        )

        risk_result = evaluate_transaction(
            fraud_probability
        )

        monitoring_service.record_prediction(
            fraud_probability=fraud_probability,
            is_fraud=is_fraud,
        )

        return {
            "transaction": transaction,
            "prediction": prediction,
            "risk": risk_result,
            "monitoring": {
                "recorded": True,
            },
        }


def analyze(
    transaction: Dict[str, Any],
) -> Dict[str, Any]:

    service = TransactionService()

    return service.analyze_transaction(
        transaction
    )