from typing import Any, Dict, List, Optional

import numpy as np

from backend.app.services.model_monitor import (
    ModelMonitor,
)


class MonitoringService:
    """
    Application-level service for model monitoring.

    Collects prediction statistics, risk distributions,
    and basic prediction drift information.
    """

    def __init__(self):
        self.monitor = ModelMonitor()

    def record_prediction(
        self,
        fraud_probability: float,
        is_fraud: int,
    ) -> None:

        self.monitor.record_prediction(
            fraud_probability=fraud_probability,
            decision=is_fraud,
        )

    def get_model_health(self) -> Dict[str, Any]:

        statistics = (
            self.monitor.get_prediction_statistics()
        )

        return {
            "status": (
                "healthy"
                if statistics["total_predictions"] > 0
                else "waiting_for_predictions"
            ),
            "statistics": statistics,
        }

    def check_drift(
        self,
        baseline_probabilities: List[float],
    ) -> Dict[str, Any]:

        return self.monitor.calculate_prediction_drift(
            baseline_probabilities
        )

    def get_risk_distribution(self) -> Dict[str, Any]:

        if not self.monitor.predictions:
            return {
                "low": 0,
                "medium": 0,
                "high": 0,
            }

        probabilities = np.array(
            self.monitor.predictions
        )

        return {
            "low": int(
                np.sum(probabilities < 0.30)
            ),
            "medium": int(
                np.sum(
                    (probabilities >= 0.30)
                    & (probabilities < 0.70)
                )
            ),
            "high": int(
                np.sum(probabilities >= 0.70)
            ),
        }


monitoring_service = MonitoringService()