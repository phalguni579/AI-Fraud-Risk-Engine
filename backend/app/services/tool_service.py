from typing import Any, Dict

from backend.app.services.customer_service import (
    customer_service,
)
from backend.app.services.rules_service import (
    evaluate_rules,
)
from backend.app.services.transaction_history_service import (
    transaction_history_service,
)
from ml.predict import predict_transaction


class RiskToolService:
    """
    Tool layer used by the Fraud Risk Agent.

    Each method represents a capability that an AI agent
    can use while investigating a transaction.
    """

    def get_customer_profile(
        self,
        customer_id: str,
    ) -> Dict[str, Any]:

        customer = customer_service.get_customer(
            customer_id
        )

        if not customer:
            return {
                "customer_id": customer_id,
                "found": False,
                "profile": {},
            }

        return {
            "customer_id": customer_id,
            "found": True,
            "profile": customer,
        }

    def get_transaction_history(
        self,
        customer_id: str,
        limit: int = 10,
    ) -> Dict[str, Any]:

        history = (
            transaction_history_service.get_history(
                customer_id=customer_id,
                limit=limit,
            )
        )

        return {
            "customer_id": customer_id,
            "transaction_count": len(history),
            "transactions": history,
        }

    def run_fraud_model(
        self,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        return predict_transaction(
            transaction
        )

    def evaluate_fraud_rules(
        self,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        return evaluate_rules(
            transaction
        )

    def get_risk_signals(
        self,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        signals = []

        if transaction.get(
            "new_device",
            0,
        ) == 1:
            signals.append(
                "NEW_DEVICE"
            )

        if transaction.get(
            "international_transaction",
            0,
        ) == 1:
            signals.append(
                "INTERNATIONAL_TRANSACTION"
            )

        if transaction.get(
            "failed_attempts",
            0,
        ) >= 2:
            signals.append(
                "MULTIPLE_FAILED_ATTEMPTS"
            )

        if transaction.get(
            "distance_from_home",
            0,
        ) >= 100:
            signals.append(
                "UNUSUAL_LOCATION"
            )

        if transaction.get(
            "merchant_risk",
            0,
        ) >= 0.70:
            signals.append(
                "HIGH_RISK_MERCHANT"
            )

        average_amount = transaction.get(
            "average_transaction_amount",
            0,
        )

        amount = transaction.get(
            "amount",
            0,
        )

        if (
            average_amount > 0
            and amount > average_amount * 2
        ):
            signals.append(
                "UNUSUALLY_HIGH_AMOUNT"
            )

        return {
            "signal_count": len(signals),
            "signals": signals,
        }


risk_tool_service = RiskToolService()