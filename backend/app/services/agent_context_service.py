from typing import Any, Dict

from backend.app.services.customer_service import (
    customer_service,
)
from backend.app.services.transaction_history_service import (
    transaction_history_service,
)


class AgentContextService:
    """
    Builds the context that the Risk Agent can use
    while making a fraud-risk decision.
    """

    def build_context(
        self,
        customer_id: str,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        customer_context = (
            customer_service.get_customer_risk_context(
                customer_id
            )
        )

        transaction_history = (
            transaction_history_service.get_history(
                customer_id=customer_id,
                limit=10,
            )
        )

        transaction_count = (
            transaction_history_service.get_transaction_count(
                customer_id
            )
        )

        return {
            "customer": customer_context,
            "transaction": transaction,
            "transaction_history": transaction_history,
            "historical_transaction_count": (
                transaction_count
            ),
        }


agent_context_service = AgentContextService()


def build_agent_context(
    customer_id: str,
    transaction: Dict[str, Any],
) -> Dict[str, Any]:

    return agent_context_service.build_context(
        customer_id=customer_id,
        transaction=transaction,
    )