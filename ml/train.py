from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb


# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = PROJECT_ROOT / "ml" / "data"
MODEL_DIR = PROJECT_ROOT / "backend" / "app" / "models"

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

DATA_FILE = DATA_DIR / "transactions.csv"

MODEL_FILE = (
    MODEL_DIR / "fraud_model.json"
)

METADATA_FILE = (
    MODEL_DIR / "fraud_model_metadata.joblib"
)


# ============================================================
# 2. FEATURES
# ============================================================

FEATURES = [
    "amount",
    "hour",
    "distance_from_home",
    "failed_attempts",
    "account_age_days",
    "merchant_risk",
    "transactions_24h",
    "transactions_1h",
    "average_transaction_amount",
    "international_transaction",
    "new_device",
    "device_age_days",
]

TARGET = "is_fraud"


# ============================================================
# 3. GENERATE SYNTHETIC TRANSACTION DATA
# ============================================================

def generate_transaction_data(
    n_samples=15000,
    random_state=42,
):
    rng = np.random.default_rng(
        random_state
    )

    amount = np.round(
        rng.lognormal(
            mean=7.0,
            sigma=1.0,
            size=n_samples,
        ),
        2,
    )

    hour = rng.integers(
        0,
        24,
        size=n_samples,
    )

    distance_from_home = np.round(
        rng.exponential(
            scale=15,
            size=n_samples,
        ),
        2,
    )

    failed_attempts = rng.poisson(
        lam=0.3,
        size=n_samples,
    )

    account_age_days = rng.integers(
        10,
        3000,
        size=n_samples,
    )

    merchant_risk = np.round(
        rng.uniform(
            0,
            1,
            size=n_samples,
        ),
        3,
    )

    transactions_24h = rng.poisson(
        lam=4,
        size=n_samples,
    )

    transactions_1h = rng.poisson(
        lam=1,
        size=n_samples,
    )

    average_transaction_amount = np.round(
        rng.lognormal(
            mean=6.5,
            sigma=0.7,
            size=n_samples,
        ),
        2,
    )

    international_transaction = rng.binomial(
        1,
        0.08,
        size=n_samples,
    )

    new_device = rng.binomial(
        1,
        0.12,
        size=n_samples,
    )

    device_age_days = rng.integers(
        1,
        1000,
        size=n_samples,
    )

    # --------------------------------------------------------
    # Hidden fraud-risk score
    # --------------------------------------------------------

    risk_score = (
        0.00002 * amount
        + 0.8 * new_device
        + 0.7 * international_transaction
        + 0.9 * merchant_risk
        + 0.35 * failed_attempts
        + 0.25 * transactions_1h
        + 0.08 * transactions_24h
        + 0.015 * distance_from_home
        + 0.0003 * (1000 - account_age_days)
        + 0.4 * (hour <= 4).astype(int)
        + 0.25
        * (
            amount
            > average_transaction_amount * 2
        )
        + rng.normal(
            0,
            0.5,
            n_samples,
        )
    )

    fraud_probability = 1 / (
        1
        + np.exp(
            -(risk_score - 2.7)
        )
    )

    is_fraud = rng.binomial(
        1,
        fraud_probability,
    )

    df = pd.DataFrame(
        {
            "amount": amount,
            "hour": hour,
            "distance_from_home":
                distance_from_home,
            "failed_attempts":
                failed_attempts,
            "account_age_days":
                account_age_days,
            "merchant_risk":
                merchant_risk,
            "transactions_24h":
                transactions_24h,
            "transactions_1h":
                transactions_1h,
            "average_transaction_amount":
                average_transaction_amount,
            "international_transaction":
                international_transaction,
            "new_device":
                new_device,
            "device_age_days":
                device_age_days,
            "is_fraud":
                is_fraud,
        }
    )

    return df


# ============================================================
# 4. STRATIFIED TRAIN / TEST SPLIT
# ============================================================

def stratified_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
):
    rng = np.random.default_rng(
        random_state
    )

    y = np.asarray(y)

    train_indices = []
    test_indices = []

    for class_value in np.unique(y):

        class_indices = np.where(
            y == class_value
        )[0]

        rng.shuffle(class_indices)

        test_count = int(
            len(class_indices)
            * test_size
        )

        test_indices.extend(
            class_indices[:test_count]
        )

        train_indices.extend(
            class_indices[test_count:]
        )

    train_indices = np.asarray(
        train_indices
    )

    test_indices = np.asarray(
        test_indices
    )

    rng.shuffle(train_indices)
    rng.shuffle(test_indices)

    return (
        X.iloc[train_indices].reset_index(
            drop=True
        ),
        X.iloc[test_indices].reset_index(
            drop=True
        ),
        y[train_indices],
        y[test_indices],
    )


# ============================================================
# 5. MODEL METRICS
# ============================================================

def calculate_metrics(
    y_true,
    y_prediction,
    y_probability,
):
    y_true = np.asarray(y_true)
    y_prediction = np.asarray(
        y_prediction
    )
    y_probability = np.asarray(
        y_probability
    )

    true_positive = np.sum(
        (y_true == 1)
        & (y_prediction == 1)
    )

    true_negative = np.sum(
        (y_true == 0)
        & (y_prediction == 0)
    )

    false_positive = np.sum(
        (y_true == 0)
        & (y_prediction == 1)
    )

    false_negative = np.sum(
        (y_true == 1)
        & (y_prediction == 0)
    )

    precision = (
        true_positive
        / (
            true_positive
            + false_positive
        )
        if (
            true_positive
            + false_positive
        ) > 0
        else 0.0
    )

    recall = (
        true_positive
        / (
            true_positive
            + false_negative
        )
        if (
            true_positive
            + false_negative
        ) > 0
        else 0.0
    )

    f1 = (
        2 * precision * recall
        / (precision + recall)
        if precision + recall > 0
        else 0.0
    )

    # --------------------------------------------------------
    # ROC-AUC using ranking
    # --------------------------------------------------------

    positive_scores = (
        y_probability[y_true == 1]
    )

    negative_scores = (
        y_probability[y_true == 0]
    )

    if (
        len(positive_scores) > 0
        and len(negative_scores) > 0
    ):
        comparisons = (
            positive_scores[:, None]
            > negative_scores[None, :]
        )

        ties = (
            positive_scores[:, None]
            == negative_scores[None, :]
        )

        roc_auc = (
            comparisons.sum()
            + 0.5 * ties.sum()
        ) / (
            len(positive_scores)
            * len(negative_scores)
        )
    else:
        roc_auc = 0.0

    return {
        "precision": float(
            precision
        ),
        "recall": float(
            recall
        ),
        "f1": float(
            f1
        ),
        "roc_auc": float(
            roc_auc
        ),
        "true_positive": int(
            true_positive
        ),
        "true_negative": int(
            true_negative
        ),
        "false_positive": int(
            false_positive
        ),
        "false_negative": int(
            false_negative
        ),
    }


# ============================================================
# 6. GENERATE DATASET
# ============================================================

print(
    "\nGenerating transaction dataset..."
)

df = generate_transaction_data()

df.to_csv(
    DATA_FILE,
    index=False,
)

print(
    f"Dataset saved to: {DATA_FILE}"
)

print(
    f"Dataset shape: {df.shape}"
)

print(
    "\nFraud distribution:"
)

print(
    df[TARGET].value_counts()
)

print(
    "\nFraud percentage:"
)

print(
    round(
        df[TARGET].mean() * 100,
        2,
    ),
    "%",
)


# ============================================================
# 7. PREPARE FEATURES
# ============================================================

X = df[FEATURES]

y = df[TARGET].to_numpy()


# ============================================================
# 8. TRAIN / TEST SPLIT
# ============================================================

(
    X_train,
    X_test,
    y_train,
    y_test,
) = stratified_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)

print(
    "\nTraining samples:",
    len(X_train),
)

print(
    "Testing samples:",
    len(X_test),
)


# ============================================================
# 9. CLASS IMBALANCE
# ============================================================

negative_count = np.sum(
    y_train == 0
)

positive_count = np.sum(
    y_train == 1
)

scale_pos_weight = (
    negative_count
    / max(
        positive_count,
        1,
    )
)

print(
    "\nScale Pos Weight:",
    round(
        scale_pos_weight,
        2,
    ),
)


# ============================================================
# 10. CREATE XGBOOST DMATRIX
# ============================================================

print(
    "\nPreparing XGBoost matrices..."
)

train_matrix = xgb.DMatrix(
    X_train,
    label=y_train,
    feature_names=FEATURES,
)

test_matrix = xgb.DMatrix(
    X_test,
    label=y_test,
    feature_names=FEATURES,
)


# ============================================================
# 11. XGBOOST PARAMETERS
# ============================================================

params = {
    "objective":
        "binary:logistic",

    "max_depth":
        6,

    "learning_rate":
        0.05,

    "subsample":
        0.8,

    "colsample_bytree":
        0.8,

    "eval_metric":
        "logloss",

    "scale_pos_weight":
        scale_pos_weight,

    "seed":
        42,
}


# ============================================================
# 12. TRAIN NATIVE XGBOOST BOOSTER
# ============================================================

print(
    "\nTraining native XGBoost fraud model..."
)

model = xgb.train(
    params=params,
    dtrain=train_matrix,
    num_boost_round=300,
)

print(
    "Model training completed."
)


# ============================================================
# 13. PREDICTIONS
# ============================================================

print(
    "\nGenerating predictions..."
)

y_probability = model.predict(
    test_matrix
)

threshold = 0.50

y_prediction = (
    y_probability >= threshold
).astype(int)


# ============================================================
# 14. MODEL EVALUATION
# ============================================================

metrics = calculate_metrics(
    y_test,
    y_prediction,
    y_probability,
)

print(
    "\n================ MODEL PERFORMANCE ================"
)

print(
    f"Precision : "
    f"{metrics['precision']:.4f}"
)

print(
    f"Recall    : "
    f"{metrics['recall']:.4f}"
)

print(
    f"F1 Score  : "
    f"{metrics['f1']:.4f}"
)

print(
    f"ROC-AUC   : "
    f"{metrics['roc_auc']:.4f}"
)

print(
    "\nConfusion Matrix:"
)

print(
    f"[[{metrics['true_negative']}, "
    f"{metrics['false_positive']}],"
)

print(
    f" [{metrics['false_negative']}, "
    f"{metrics['true_positive']}]]"
)


# ============================================================
# 15. SAVE NATIVE XGBOOST MODEL
# ============================================================

print(
    "\nSaving XGBoost model..."
)

model.save_model(
    str(MODEL_FILE)
)

joblib.dump(
    {
        "features": FEATURES,
        "threshold": threshold,
        "metrics": metrics,
        "model_file": str(
            MODEL_FILE
        ),
    },
    METADATA_FILE,
)

print(
    f"XGBoost model saved to: "
    f"{MODEL_FILE}"
)

print(
    f"Model metadata saved to: "
    f"{METADATA_FILE}"
)

print(
    "\nTraining pipeline completed successfully."
)