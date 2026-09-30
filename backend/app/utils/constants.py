"""
Project-wide constants used by the Fraud Risk Engine.
"""

# Risk levels
RISK_LOW = "LOW"
RISK_MEDIUM = "MEDIUM"
RISK_HIGH = "HIGH"


# Business decisions
DECISION_APPROVE = "APPROVE"
DECISION_REVIEW = "REVIEW"
DECISION_BLOCK = "BLOCK"


# Model configuration
DEFAULT_MODEL_THRESHOLD = 0.50

LOW_RISK_THRESHOLD = 0.30

HIGH_RISK_THRESHOLD = 0.70


# Monitoring
DRIFT_THRESHOLD = 0.10


# API
API_VERSION = "v1"


# Application metadata
APP_NAME = "AI Fraud & Agentic Risk Decision Engine"

APP_VERSION = "1.0.0"