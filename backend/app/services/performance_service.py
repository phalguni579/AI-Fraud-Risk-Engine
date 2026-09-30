from typing import Any, Dict, List

from backend.app.services.model_performance_service import (
    get_model_performance,
)


class PerformanceService:
    """
    Application service for accessing model
    performance information.
    """

    def calculate_performance(
        self,
        actual: List[int],
        predicted: List[int],
        probabilities: List[float],
    ) -> Dict[str, Any]:

        return get_model_performance()

    def get_latest_performance(
        self,
    ) -> Dict[str, Any]:

        performance = get_model_performance()

        return {
            "status": (
                "healthy"
                if performance.get("available", False)
                else "unavailable"
            ),
            **performance,
        }


performance_service = PerformanceService()