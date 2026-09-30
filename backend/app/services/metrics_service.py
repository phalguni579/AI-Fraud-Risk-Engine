from typing import Any, Dict, List

import numpy as np


class MetricsService:
    """
    Calculates operational metrics for the fraud
    detection system.

    These metrics can later power the dashboard.
    """

    def calculate_metrics(
        self,
        probabilities: List[float],
        decisions: List[int],
    ) -> Dict[str, Any]:

        if not probabilities:
            return {
                "total_predictions": 0,
                "average_probability": 0.0,
                "high_risk_predictions": 0,
                "high_risk_rate": 0.0,
                "blocked_predictions": 0,
                "block_rate": 0.0,
            }

        probability_array = np.array(
            probabilities,
            dtype=float,
        )

        decision_array = np.array(
            decisions,
            dtype=int,
        )

        total_predictions = len(
            probability_array
        )

        high_risk_predictions = int(
            np.sum(
                probability_array >= 0.70
            )
        )

        blocked_predictions = int(
            np.sum(
                decision_array == 1
            )
        )

        return {
            "total_predictions": (
                total_predictions
            ),
            "average_probability": round(
                float(
                    probability_array.mean()
                ),
                4,
            ),
            "minimum_probability": round(
                float(
                    probability_array.min()
                ),
                4,
            ),
            "maximum_probability": round(
                float(
                    probability_array.max()
                ),
                4,
            ),
            "high_risk_predictions": (
                high_risk_predictions
            ),
            "high_risk_rate": round(
                high_risk_predictions
                / total_predictions,
                4,
            ),
            "blocked_predictions": (
                blocked_predictions
            ),
            "block_rate": round(
                blocked_predictions
                / total_predictions,
                4,
            ),
        }


metrics_service = MetricsService()