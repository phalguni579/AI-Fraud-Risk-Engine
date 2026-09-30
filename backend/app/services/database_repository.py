import json
from typing import Any, Dict, List, Optional

from backend.app.services.database_service import (
    AuditRecord,
    TransactionRecord,
    get_database,
)


class DatabaseRepository:
    """
    Repository layer responsible for reading and writing
    fraud-risk data from the database.
    """

    def _parse_json(
        self,
        value: Optional[str],
    ) -> Dict[str, Any]:
        if not value:
            return {}

        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def get_transaction(
        self,
        transaction_id: str,
    ) -> Optional[Dict[str, Any]]:
        db = get_database()

        try:
            record = (
                db.query(TransactionRecord)
                .filter(
                    TransactionRecord.transaction_id
                    == transaction_id
                )
                .first()
            )

            if not record:
                return None

            transaction = self._parse_json(
                record.transaction_data
            )
            prediction = self._parse_json(
                record.prediction
            )
            risk = self._parse_json(
                record.risk
            )
            explanation = self._parse_json(
                record.explanation
            )

            return {
                "transaction_id": record.transaction_id,
                "customer_id": record.customer_id,
                "transaction": transaction,
                "prediction": prediction,
                "risk": risk,
                "explanation": explanation,
                "amount": float(
                    transaction.get("amount", 0)
                ),
                "fraud_probability": float(
                    prediction.get(
                        "fraud_probability",
                        0,
                    )
                ),
                "risk_level": risk.get(
                    "risk_level",
                    "UNKNOWN",
                ),
                "decision": risk.get(
                    "decision",
                    "UNKNOWN",
                ),
                "created_at": (
                    record.created_at.isoformat()
                    if record.created_at
                    else None
                ),
            }

        finally:
            db.close()

    def get_customer_transactions(
        self,
        customer_id: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        db = get_database()

        try:
            records = (
                db.query(TransactionRecord)
                .filter(
                    TransactionRecord.customer_id
                    == customer_id
                )
                .order_by(
                    TransactionRecord.created_at.desc()
                )
                .limit(limit)
                .all()
            )

            results = []

            for record in records:
                transaction = self._parse_json(
                    record.transaction_data
                )

                prediction = self._parse_json(
                    record.prediction
                )

                risk = self._parse_json(
                    record.risk
                )

                explanation = self._parse_json(
                    record.explanation
                )

                results.append(
                    {
                        "transaction_id": (
                            record.transaction_id
                        ),
                        "customer_id": (
                            record.customer_id
                        ),
                        "transaction": transaction,
                        "prediction": prediction,
                        "risk": risk,
                        "explanation": explanation,
                        "amount": float(
                            transaction.get(
                                "amount",
                                0,
                            )
                        ),
                        "fraud_probability": float(
                            prediction.get(
                                "fraud_probability",
                                0,
                            )
                        ),
                        "risk_level": risk.get(
                            "risk_level",
                            "UNKNOWN",
                        ),
                        "decision": risk.get(
                            "decision",
                            "UNKNOWN",
                        ),
                        "created_at": (
                            record.created_at.isoformat()
                            if record.created_at
                            else None
                        ),
                    }
                )

            return results

        finally:
            db.close()

    def get_audit_events(
        self,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        db = get_database()

        try:
            records = (
                db.query(AuditRecord)
                .order_by(
                    AuditRecord.created_at.desc()
                )
                .limit(limit)
                .all()
            )

            results = []

            for record in records:
                event_data = self._parse_json(
                    record.event_data
                )

                results.append(
                    {
                        "transaction_id": (
                            record.transaction_id
                        ),
                        "customer_id": (
                            record.customer_id
                        ),
                        "event_type": (
                            record.event_type
                        ),
                        "event_data": event_data,
                        "created_at": (
                            record.created_at.isoformat()
                            if record.created_at
                            else None
                        ),
                    }
                )

            return results

        finally:
            db.close()


database_repository = DatabaseRepository()