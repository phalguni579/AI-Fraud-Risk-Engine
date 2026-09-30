from datetime import datetime, timezone
from typing import Any, Dict, List


class AuditService:
    """
    Records important fraud-risk decisions so that
    they can be reviewed later.
    """

    def __init__(self):
        self.events: List[Dict[str, Any]] = []

    def record_decision(
        self,
        transaction_id: str,
        decision_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Store one risk decision in the in-memory audit log.
        """

        event = {
            "transaction_id": transaction_id,
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),
            "decision": decision_result.get(
                "risk",
                {}
            ).get(
                "decision",
                "UNKNOWN",
            ),
            "risk_level": decision_result.get(
                "risk",
                {}
            ).get(
                "risk_level",
                "UNKNOWN",
            ),
            "fraud_probability": decision_result.get(
                "prediction",
                {}
            ).get(
                "fraud_probability",
                0.0,
            ),
        }

        self.events.append(event)

        return event

    def get_events(self) -> List[Dict[str, Any]]:
        """
        Return all recorded audit events.
        """

        return self.events

    def get_event_count(self) -> int:
        """
        Return total number of recorded decisions.
        """

        return len(self.events)


audit_service = AuditService()