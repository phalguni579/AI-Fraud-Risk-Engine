import os

from dotenv import load_dotenv


# Load environment variables from .env
load_dotenv()


class Settings:
    """
    Central configuration for the Fraud Risk Engine.
    """

    APP_NAME: str = os.getenv(
        "APP_NAME",
        "AI Fraud & Agentic Risk Decision Engine",
    )

    APP_VERSION: str = os.getenv(
        "APP_VERSION",
        "1.0.0",
    )

    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "development",
    )

    MODEL_THRESHOLD: float = float(
        os.getenv(
            "MODEL_THRESHOLD",
            "0.50",
        )
    )

    LOW_RISK_THRESHOLD: float = float(
        os.getenv(
            "LOW_RISK_THRESHOLD",
            "0.30",
        )
    )

    HIGH_RISK_THRESHOLD: float = float(
        os.getenv(
            "HIGH_RISK_THRESHOLD",
            "0.70",
        )
    )


settings = Settings()