from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd
import xgboost as xgb


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = (
    PROJECT_ROOT
    / "app"
    / "models"
)

MODEL_FILE = (
    MODEL_DIR
    / "fraud_model.json"
)

METADATA_FILE = (
    MODEL_DIR
    / "fraud_model_metadata.joblib"
)


# ============================================================
# LOAD MODEL
# ============================================================

def load_explainability_model():
    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_FILE}"
        )

    if not METADATA_FILE.exists():
        raise FileNotFoundError(
            f"Metadata not found: {METADATA_FILE}"
        )

    booster = xgb.Booster()

    booster.load_model(
        str(MODEL_FILE)
    )

    metadata = joblib.load(
        METADATA_FILE
    )

    return booster, metadata


# ============================================================
# FEATURE CONTRIBUTIONS
# ============================================================

def explain_transaction(
    transaction: Dict[str, Any]
):
    """
    Generate XGBoost native feature contributions.

    Uses XGBoost's pred_contribs=True instead
    of importing the SHAP Python package.
    """

    booster, metadata = (
        load_explainability_model()
    )

    features = metadata[
        "features"
    ]

    transaction_df = pd.DataFrame(
        [transaction]
    )

    # Ensure correct feature order
    transaction_df = transaction_df[
        features
    ]

    matrix = xgb.DMatrix(
        transaction_df,
        feature_names=features,
    )

    contributions = booster.predict(
        matrix,
        pred_contribs=True,
    )[0]

    feature_contributions = []

    for index, feature in enumerate(
        features
    ):

        contribution = float(
            contributions[index]
        )

        feature_contributions.append(
            {
                "feature": feature,
                "value": transaction_df.iloc[
                    0
                ][feature],
                "contribution": round(
                    contribution,
                    6,
                ),
                "impact": (
                    "increases_risk"
                    if contribution > 0
                    else "decreases_risk"
                ),
            }
        )

    # Highest-impact features first
    feature_contributions.sort(
        key=lambda item: abs(
            item["contribution"]
        ),
        reverse=True,
    )

    # Last contribution is the model bias/base value
    bias = float(
        contributions[-1]
    )

    top_features = (
        feature_contributions[:5]
    )

    return {
        "available": True,
        "method": (
            "XGBoost Native "
            "Feature Contributions"
        ),
        "top_features": top_features,
        "all_features": feature_contributions,
        "bias": round(
            bias,
            6,
        ),
    }


# ============================================================
# BACKWARD-COMPATIBLE FUNCTIONS
# ============================================================

def get_shap_explanation(
    transaction: Dict[str, Any]
):
    """
    Backward-compatible wrapper.
    """

    return explain_transaction(
        transaction
    )


def explain_with_shap(
    transaction: Dict[str, Any]
):
    """
    Backward-compatible wrapper used
    by decision_service.py.

    The backend calls this function using
    the old SHAP-oriented name, but internally
    we use native XGBoost feature contributions.
    """

    return explain_transaction(
        transaction
    )


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    sample_transaction = {
        "amount": 18500,
        "hour": 2,
        "distance_from_home": 120,
        "failed_attempts": 3,
        "account_age_days": 180,
        "merchant_risk": 0.85,
        "transactions_24h": 12,
        "transactions_1h": 4,
        "average_transaction_amount": 2500,
        "international_transaction": 1,
        "new_device": 1,
        "device_age_days": 2,
    }

    result = explain_with_shap(
        sample_transaction
    )

    print(
        "\nFeature Contribution Result"
    )

    print(
        "============================"
    )

    print(
        "Method:",
        result["method"],
    )

    print(
        "\nTop Risk Features:"
    )

    for feature in result[
        "top_features"
    ]:

        print(
            f"{feature['feature']}: "
            f"{feature['contribution']} "
            f"({feature['impact']})"
        )