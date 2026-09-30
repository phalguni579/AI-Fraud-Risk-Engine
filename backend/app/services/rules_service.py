from typing import Any, Dict, List


RULES = [
    {
        "id": "R001",
        "name": "High Transaction Amount",
        "description": "Transaction amount is significantly higher than the customer's average.",
        "severity": "medium",
    },
    {
        "id": "R002",
        "name": "New Device + Large Transaction",
        "description": "A large transaction is being attempted from a newly registered device.",
        "severity": "high",
    },
    {
        "id": "R003",
        "name": "Multiple Failed Attempts",
        "description": "Multiple failed transaction attempts were detected.",
        "severity": "high",
    },
    {
        "id": "R004",
        "name": "High Transaction Velocity",
        "description": "Unusually high transaction activity was detected within one hour.",
        "severity": "high",
    },
    {
        "id": "R005",
        "name": "International New Device",
        "description": "An international transaction was initiated from a new device.",
        "severity": "high",
    },
]


def evaluate_rules(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate deterministic fraud rules for a transaction.
    """

    amount = float(transaction.get("amount", 0))
    average_amount = float(
        transaction.get("average_transaction_amount", 0)
    )

    failed_attempts = int(
        transaction.get("failed_attempts", 0)
    )

    transactions_1h = int(
        transaction.get("transactions_1h", 0)
    )

    international_transaction = int(
        transaction.get("international_transaction", 0)
    )

    new_device = int(
        transaction.get("new_device", 0)
    )

    device_age_days = int(
        transaction.get("device_age_days", 0)
    )

    triggered_rules: List[Dict[str, Any]] = []

    # R001 — unusually large transaction
    if average_amount > 0 and amount >= average_amount * 2:
        triggered_rules.append({
            **RULES[0],
            "triggered": True,
            "reason": (
                f"Transaction amount ₹{amount:,.0f} is at least "
                f"2x the average transaction amount "
                f"₹{average_amount:,.0f}."
            ),
        })

    # R002 — new device + large transaction
    if (
        new_device == 1
        and average_amount > 0
        and amount >= average_amount * 2
    ):
        triggered_rules.append({
            **RULES[1],
            "triggered": True,
            "reason": (
                "A large transaction was attempted from a new device."
            ),
        })

    # R003 — multiple failed attempts
    if failed_attempts >= 3:
        triggered_rules.append({
            **RULES[2],
            "triggered": True,
            "reason": (
                f"{failed_attempts} failed attempts were detected."
            ),
        })

    # R004 — high transaction velocity
    if transactions_1h >= 5:
        triggered_rules.append({
            **RULES[3],
            "triggered": True,
            "reason": (
                f"{transactions_1h} transactions occurred within "
                "the last hour."
            ),
        })

    # R005 — international transaction from new device
    if international_transaction == 1 and new_device == 1:
        triggered_rules.append({
            **RULES[4],
            "triggered": True,
            "reason": (
                "International transaction detected from a new device."
            ),
        })

    high_severity_count = sum(
        1
        for rule in triggered_rules
        if rule["severity"] == "high"
    )

    if high_severity_count >= 2:
        decision = "BLOCK"
    elif triggered_rules:
        decision = "REVIEW"
    else:
        decision = "APPROVE"

    return {
        "decision": decision,
        "rules_triggered": triggered_rules,
        "triggered_count": len(triggered_rules),
        "high_severity_count": high_severity_count,
        "device_age_days": device_age_days,
    }