from typing import Any, Dict, Optional


class CustomerService:
    """
    Provides customer-level risk context.

    This is an in-memory implementation for now.
    Later, this can be connected to PostgreSQL.
    """

    def __init__(self):
        self.customers: Dict[str, Dict[str, Any]] = {}

    def add_customer(
        self,
        customer_id: str,
        customer_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Store customer profile information.
        """

        profile = {
            "customer_id": customer_id,
            **customer_data,
        }

        self.customers[customer_id] = profile

        return profile

    def get_customer(
        self,
        customer_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve a customer profile.
        """

        return self.customers.get(customer_id)

    def get_customer_risk_context(
        self,
        customer_id: str,
    ) -> Dict[str, Any]:
        """
        Return customer information relevant
        to fraud-risk analysis.
        """

        customer = self.customers.get(
            customer_id
        )

        if not customer:
            return {
                "customer_id": customer_id,
                "exists": False,
                "risk_context": {},
            }

        return {
            "customer_id": customer_id,
            "exists": True,
            "risk_context": {
                "account_age_days": customer.get(
                    "account_age_days",
                    0,
                ),
                "average_transaction_amount": customer.get(
                    "average_transaction_amount",
                    0,
                ),
                "usual_country": customer.get(
                    "usual_country",
                    "UNKNOWN",
                ),
                "usual_device_count": customer.get(
                    "usual_device_count",
                    0,
                ),
            },
        }


customer_service = CustomerService()