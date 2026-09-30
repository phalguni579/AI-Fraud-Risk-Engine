from typing import Any, Dict, List, Optional

from backend.app.services.database_query_service import (
    database_query_service,
)
from backend.app.services.database_service import (
    database_service,
)


class PersistenceService:
    """
    High-level persistence service for the fraud-risk
    decision engine.

    Keeps database operations separate from business logic.
    """

    def save_decision(
        self,
        transaction_id: str,
        customer_id: str,
        transaction: Dict[str, Any],
        prediction: Dict[str, Any],
        risk: Dict[str, Any],
        explanation: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Persist the complete decision result.

        The database service stores the original transaction,
        ML prediction, risk evaluation and explanation as
        structured JSON fields.
        """

        transaction_record = database_service.save_transaction(
            transaction_id=transaction_id,
            customer_id=customer_id,
            transaction_data=transaction,
            prediction=prediction,
            risk=risk,
            explanation=explanation,
        )

        database_service.save_audit_event(
            transaction_id=transaction_id,
            customer_id=customer_id,
            event_type="FRAUD_RISK_DECISION",
            event_data={
                "transaction": transaction,
                "prediction": prediction,
                "risk": risk,
                "explanation": explanation or {},
            },
        )

        return transaction_record

    def get_transaction(
        self,
        transaction_id: str,
    ) -> Optional[Dict[str, Any]]:
        return database_query_service.get_transaction(
            transaction_id
        )

    def get_customer_transactions(
        self,
        customer_id: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        return database_query_service.get_customer_transactions(
            customer_id=customer_id,
            limit=limit,
        )

    def get_audit_events(
        self,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        return database_query_service.get_audit_events(
            limit=limit
        )


persistence_service = PersistenceService()