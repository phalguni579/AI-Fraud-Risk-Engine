from pathlib import Path
from typing import Any, Dict

import joblib


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = (
    PROJECT_ROOT
    / "app"
    / "models"
)

METADATA_FILE = (
    MODEL_DIR
    / "fraud_model_metadata.joblib"
)


# ============================================================
# MAIN FUNCTION
# ============================================================

def model_performance() -> Dict[str, Any]:
    """
    Load model performance metrics generated during
    XGBoost training.

    This implementation intentionally does NOT import
    sklearn because sklearn is unavailable in the current
    Windows environment.
    """

    if not METADATA_FILE.exists():
        return {
            "available": False,
            "message": (
                "Model performance metadata not found."
            ),
            "metrics": {},
        }

    metadata = joblib.load(
        METADATA_FILE
    )

    metrics = metadata.get(
        "metrics",
        {},
    )

    return {
        "available": True,
        "metrics": metrics,
        "threshold": metadata.get(
            "threshold",
            0.50,
        ),
        "features": metadata.get(
            "features",
            [],
        ),
    }


# ============================================================
# EXACT COMPATIBILITY FUNCTION
# ============================================================

def model_performance_service() -> Dict[str, Any]:
    """
    Compatibility function used by performance_service.py.
    """

    return model_performance()


# ============================================================
# ADDITIONAL COMPATIBILITY FUNCTIONS
# ============================================================

def get_model_performance() -> Dict[str, Any]:
    return model_performance()


def get_performance() -> Dict[str, Any]:
    return model_performance()


def get_performance_summary() -> Dict[str, Any]:

    result = model_performance()

    if not result.get("available"):
        return result

    metrics = result.get(
        "metrics",
        {},
    )

    return {
        "available": True,
        "precision": metrics.get(
            "precision",
            0.0,
        ),
        "recall": metrics.get(
            "recall",
            0.0,
        ),
        "f1": metrics.get(
            "f1",
            0.0,
        ),
        "roc_auc": metrics.get(
            "roc_auc",
            0.0,
        ),
        "true_positive": metrics.get(
            "true_positive",
            0,
        ),
        "true_negative": metrics.get(
            "true_negative",
            0,
        ),
        "false_positive": metrics.get(
            "false_positive",
            0,
        ),
        "false_negative": metrics.get(
            "false_negative",
            0,
        ),
        "threshold": result.get(
            "threshold",
            0.50,
        ),
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    result = model_performance_service()

    print(
        "\nModel Performance"
    )

    print(
        "================="
    )

    print(result)