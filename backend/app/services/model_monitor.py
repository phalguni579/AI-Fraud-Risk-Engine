from typing import Dict, List

import numpy as np


class ModelMonitor:
    """
    Monitors basic health and performance signals
    for the fraud detection model.
    """

    def __init__(self):
        self.predictions: List[float] = []
        self.decisions: List[int] = []

    def record_prediction(
        self,
        fraud_probability: float,
        decision: int,
    ) -> None:
        """
        Store a model prediction for monitoring.
        """

        self.predictions.append(
            float(fraud_probability)
        )

        self.decisions.append(
            int(decision)
        )

    def get_prediction_statistics(self) -> Dict:
        """
        Calculate basic prediction statistics.
        """

        if not self.predictions:
            return {
                "total_predictions": 0,
                "average_fraud_probability": 0.0,
                "high_risk_rate": 0.0,
            }

        probabilities = np.array(
            self.predictions
        )

        high_risk_count = np.sum(
            probabilities >= 0.70
        )

        return {
            "total_predictions": len(
                self.predictions
            ),
            "average_fraud_probability": round(
                float(probabilities.mean()),
                4,
            ),
            "minimum_fraud_probability": round(
                float(probabilities.min()),
                4,
            ),
            "maximum_fraud_probability": round(
                float(probabilities.max()),
                4,
            ),
            "high_risk_rate": round(
                float(
                    high_risk_count
                    / len(probabilities)
                ),
                4,
            ),
        }

    def calculate_prediction_drift(
        self,
        baseline_probabilities: List[float],
    ) -> Dict:
        """
        Compare current predictions with a
        baseline prediction distribution.
        """

        if not baseline_probabilities:
            return {
                "drift_detected": False,
                "drift_score": 0.0,
                "message": (
                    "No baseline data available."
                ),
            }

        if not self.predictions:
            return {
                "drift_detected": False,
                "drift_score": 0.0,
                "message": (
                    "No current predictions available."
                ),
            }

        baseline_mean = np.mean(
            baseline_probabilities
        )

        current_mean = np.mean(
            self.predictions
        )

        drift_score = abs(
            current_mean - baseline_mean
        )

        drift_detected = (
            drift_score >= 0.10
        )

        return {
            "drift_detected": bool(
                drift_detected
            ),
            "drift_score": round(
                float(drift_score),
                4,
            ),
            "baseline_mean": round(
                float(baseline_mean),
                4,
            ),
            "current_mean": round(
                float(current_mean),
                4,
            ),
            "message": (
                "Prediction distribution has shifted."
                if drift_detected
                else
                "Prediction distribution is stable."
            ),
        }


def create_model_monitor() -> ModelMonitor:
    """
    Create a model monitoring instance.
    """

    return ModelMonitor()