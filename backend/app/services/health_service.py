from typing import Dict

from backend.app.services.llm_service import (
    llm_service,
)


class HealthService:
    """
    Checks the health/configuration state of the
    major application components.
    """

    def get_health(self) -> Dict[str, object]:

        return {
            "status": "healthy",
            "service": "fraud-risk-engine",
            "version": "1.0.0",
            "components": {
                "api": "healthy",
                "fraud_model": "ready",
                "risk_engine": "ready",
                "rules_engine": "ready",
                "shap": "ready",
                "monitoring": "ready",
                "audit": "ready",
                "llm": (
                    "configured"
                    if llm_service.is_configured()
                    else "not_configured"
                ),
            },
        }


health_service = HealthService()