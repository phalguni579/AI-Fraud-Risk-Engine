from pathlib import Path

import joblib
import pandas as pd
import xgboost as xgb


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

MODEL_DIR = (
    PROJECT_ROOT
    / "backend"
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

def load_model():
    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"XGBoost model not found: {MODEL_FILE}"
        )

    if not METADATA_FILE.exists():
        raise FileNotFoundError(
            f"Model metadata not found: {METADATA_FILE}"
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
# PREDICT TRANSACTION
# ============================================================

def predict_transaction(
    transaction: dict,
):
    booster, metadata = load_model()

    features = metadata[
        "features"
    ]

    threshold = metadata[
        "threshold"
    ]

    transaction_df = pd.DataFrame(
        [transaction]
    )

    # Ensure correct feature order
    transaction_df = transaction_df[
        features
    ]

    transaction_matrix = xgb.DMatrix(
        transaction_df,
        feature_names=features,
    )

    fraud_probability = float(
        booster.predict(
            transaction_matrix
        )[0]
    )

    prediction = int(
        fraud_probability >= threshold
    )

    return {
        "fraud_probability": round(
            fraud_probability,
            4,
        ),
        "is_fraud": prediction,
        "decision": (
            "FRAUD"
            if prediction == 1
            else "LEGITIMATE"
        ),
    }


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

    result = predict_transaction(
        sample_transaction
    )

    print(
        "\nTransaction Risk Result"
    )

    print(
        "======================="
    )

    for key, value in result.items():
        print(
            f"{key}: {value}"
        )