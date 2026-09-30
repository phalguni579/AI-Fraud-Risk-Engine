from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class TransactionHistoryService:
    """
    Stores and retrieves customer transaction history.

    This is currently an in-memory implementation.
    Later, we can replace it with PostgreSQL.
    """

    def __init__(self):
        self.transactions: Dict[
            str, List[Dict[str, Any]]
        ] = {}

    def add_transaction(
        self,
        customer_id: str,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Add a transaction to a customer's history.
        """

        record = {
            **transaction,
            "customer_id": customer_id,
            "recorded_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

        if customer_id not in self.transactions:
            self.transactions[customer_id] = []

        self.transactions[customer_id].append(
            record
        )

        return record

    def get_history(
        self,
        customer_id: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Return the customer's most recent transactions.
        """

        history = self.transactions.get(
            customer_id,
            [],
        )

        return history[-limit:]

    def get_latest_transaction(
        self,
        customer_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Return the customer's latest transaction.
        """

        history = self.transactions.get(
            customer_id,
            [],
        )

        if not history:
            return None

        return history[-1]

    def get_transaction_count(
        self,
        customer_id: str,
    ) -> int:
        """
        Return the number of transactions
        recorded for a customer.
        """

        return len(
            self.transactions.get(
                customer_id,
                [],
            )
        )


transaction_history_service = (
    TransactionHistoryService()
)