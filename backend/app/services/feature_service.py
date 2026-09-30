from typing import Dict


class FeatureService:
    """
    Prepares raw transaction information into
    model-ready features.
    """

    def prepare_features(
        self,
        transaction: Dict,
    ) -> Dict:
        """
        Normalize and prepare transaction features.
        """

        features = {
            "amount": float(
                transaction.get("amount", 0)
            ),

            "hour": int(
                transaction.get("hour", 0)
            ),

            "distance_from_home": float(
                transaction.get(
                    "distance_from_home",
                    0,
                )
            ),

            "failed_attempts": int(
                transaction.get(
                    "failed_attempts",
                    0,
                )
            ),

            "account_age_days": int(
                transaction.get(
                    "account_age_days",
                    0,
                )
            ),

            "merchant_risk": float(
                transaction.get(
                    "merchant_risk",
                    0,
                )
            ),

            "transactions_24h": int(
                transaction.get(
                    "transactions_24h",
                    0,
                )
            ),

            "transactions_1h": int(
                transaction.get(
                    "transactions_1h",
                    0,
                )
            ),

            "average_transaction_amount": float(
                transaction.get(
                    "average_transaction_amount",
                    0,
                )
            ),

            "international_transaction": int(
                transaction.get(
                    "international_transaction",
                    0,
                )
            ),

            "new_device": int(
                transaction.get(
                    "new_device",
                    0,
                )
            ),

            "device_age_days": int(
                transaction.get(
                    "device_age_days",
                    0,
                )
            ),
        }

        return features


def prepare_transaction_features(
    transaction: Dict,
) -> Dict:
    """
    Convenience function for feature preparation.
    """

    service = FeatureService()

    return service.prepare_features(
        transaction
    )