from typing import Any, Dict


class RequestValidationService:
    """
    Performs application-level validation for incoming
    fraud-risk requests.

    Pydantic handles schema validation.
    This service handles business-level validation.
    """

    def validate_transaction(
        self,
        transaction: Dict[str, Any],
    ) -> Dict[str, Any]:

        errors = []

        amount = transaction.get(
            "amount",
            0,
        )

        average_amount = transaction.get(
            "average_transaction_amount",
            0,
        )

        if amount <= 0:
            errors.append(
                "Transaction amount must be greater than zero."
            )

        if average_amount <= 0:
            errors.append(
                "Average transaction amount must be greater than zero."
            )

        if (
            transaction.get(
                "transactions_1h",
                0,
            )
            > transaction.get(
                "transactions_24h",
                0,
            )
        ):
            errors.append(
                "Transactions in one hour cannot exceed "
                "transactions in twenty-four hours."
            )

        if (
            transaction.get(
                "device_age_days",
                0,
            )
            < 0
        ):
            errors.append(
                "Device age cannot be negative."
            )

        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }


request_validation_service = (
    RequestValidationService()
)


def validate_transaction_request(
    transaction: Dict[str, Any],
) -> Dict[str, Any]:

    return request_validation_service.validate_transaction(
        transaction
    )