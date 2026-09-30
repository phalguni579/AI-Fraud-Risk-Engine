from typing import Any, Dict, List, Optional

from backend.app.services.database_repository import (
    database_repository,
)


class DatabaseQueryService:
    """
    Application-level read service for persistent
    fraud-risk data.
    """

    def get_transaction(
        self,
        transaction_id: str,
    ) -> Optional[Dict[str, Any]]:

        return database_repository.get_transaction(
            transaction_id
        )

    def get_customer_transactions(
        self,
        customer_id: str,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:

        return (
            database_repository
            .get_customer_transactions(
                customer_id=customer_id,
                limit=limit,
            )
        )

    def get_audit_events(
        self,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:

        return database_repository.get_audit_events(
            limit=limit
        )


database_query_service = (
    DatabaseQueryService()
)