from typing import Any, Dict
from uuid import uuid4

from backend.app.agents.llm_risk_agent import (
    run_llm_risk_agent,
)
from backend.app.services.agent_trace_service import (
    agent_trace_service,
)
from backend.app.services.audit_service import (
    audit_service,
)
from backend.app.services.explanation_service import (
    explain_transaction,
)
from backend.app.services.monitoring_service import (
    monitoring_service,
)
from backend.app.services.persistence_service import (
    persistence_service,
)
from backend.app.services.risk_engine import (
    evaluate_transaction,
)
from backend.app.services.rules_service import (
    evaluate_rules,
)
from backend.app.services.shap_service import (
    explain_with_shap,
)
from ml.predict import predict_transaction


class DecisionService:
    """
    Complete fraud-risk decision pipeline.

    Transaction
        ↓
    ML prediction
        ↓
    Risk engine
        ↓
    Business rules
        ↓
    SHAP explanation
        ↓
    AI Risk Agent
        ↓
    Final policy decision
        ↓
    Monitoring
        ↓
    Persistent database
        ↓
    Audit
    """

    def process_transaction(
        self,
        transaction: Dict[str, Any],
        customer_id: str = "anonymous",
    ) -> Dict[str, Any]:

        transaction_id = str(uuid4())

        agent_trace_service.start_trace(
            transaction_id
        )

        # =====================================================
        # 1. ML FRAUD PREDICTION
        # =====================================================

        agent_trace_service.record_step(
            transaction_id=transaction_id,
            step="ML fraud prediction",
            tool="run_fraud_model",
        )

        prediction = predict_transaction(
            transaction
        )

        fraud_probability = float(
            prediction.get(
                "fraud_probability",
                0.0,
            )
        )

        model_decision = str(
            prediction.get(
                "decision",
                "UNKNOWN",
            )
        ).upper()

        # =====================================================
        # 2. RISK ENGINE
        # =====================================================

        agent_trace_service.record_step(
            transaction_id=transaction_id,
            step="Risk evaluation",
            tool="risk_engine",
        )

        risk_result = evaluate_transaction(
            fraud_probability
        )

        # Keep the ML/risk-engine decision separate
        # from the final business-policy decision.
        risk_level = str(
            risk_result.get(
                "risk_level",
                "LOW",
            )
        ).upper()

        risk_engine_decision = str(
            risk_result.get(
                "decision",
                "APPROVE",
            )
        ).upper()

        # =====================================================
        # 3. FRAUD RULES
        # =====================================================

        agent_trace_service.record_step(
            transaction_id=transaction_id,
            step="Fraud rule evaluation",
            tool="evaluate_fraud_rules",
        )

        rules_result = evaluate_rules(
            transaction
        )

        rule_decision = str(
            rules_result.get(
                "decision",
                "APPROVE",
            )
        ).upper()

        high_severity_count = int(
            rules_result.get(
                "high_severity_count",
                0,
            )
        )

        triggered_rules = (
            rules_result.get(
                "rules_triggered",
                [],
            )
            or []
        )

        # =====================================================
        # 4. FINAL POLICY DECISION
        # =====================================================
        #
        # IMPORTANT:
        #
        # ML prediction and final action are different.
        #
        # ML:
        #   FRAUD / LEGITIMATE
        #
        # Final action:
        #   APPROVE / REVIEW / BLOCK
        #
        # A high-severity business rule must be able
        # to override a lower ML probability.
        #
        # Example:
        #
        # ML probability = 49%
        # Rules = multiple high-severity signals
        #
        # Final decision = BLOCK
        #
        # =====================================================

        if (
            rule_decision == "BLOCK"
            or high_severity_count >= 2
            or risk_engine_decision == "BLOCK"
        ):
            final_decision = "BLOCK"

        elif (
            rule_decision == "REVIEW"
            or risk_engine_decision == "REVIEW"
            or model_decision == "FRAUD"
        ):
            final_decision = "REVIEW"

        else:
            final_decision = "APPROVE"

        # =====================================================
        # 5. MODEL EXPLAINABILITY
        # =====================================================

        shap_result = None

        try:
            agent_trace_service.record_step(
                transaction_id=transaction_id,
                step="Model explainability",
                tool="SHAP TreeExplainer",
            )

            shap_result = explain_with_shap(
                transaction
            )

        except Exception as error:
            agent_trace_service.record_step(
                transaction_id=transaction_id,
                step="Model explainability",
                tool="SHAP TreeExplainer",
                status="failed",
                details={
                    "error": str(error),
                },
            )

        # =====================================================
        # 6. HUMAN-READABLE EXPLANATION
        # =====================================================

        explanation = explain_transaction(
            transaction=transaction,
            prediction=prediction,
            risk_result=risk_result,
        )

        # =====================================================
        # 7. MONITORING
        # =====================================================

        monitoring_service.record_prediction(
            fraud_probability=fraud_probability,
            is_fraud=prediction.get(
                "is_fraud",
                0,
            ),
        )

        # =====================================================
        # 8. AI RISK AGENT
        # =====================================================

        agent_trace_service.record_step(
            transaction_id=transaction_id,
            step="AI risk investigation",
            tool="AI Fraud Risk Agent",
        )

        try:
            agent_result = run_llm_risk_agent(
                customer_id=customer_id,
                transaction=transaction,
            )

        except Exception as error:
            agent_trace_service.record_step(
                transaction_id=transaction_id,
                step="AI risk investigation",
                tool="AI Fraud Risk Agent",
                status="failed",
                details={
                    "error": str(error),
                },
            )

            agent_result = {
                "status": "failed",
                "error": str(error),
            }

        # =====================================================
        # 9. AGENT TRACE
        # =====================================================

        trace = agent_trace_service.get_trace(
            transaction_id
        )

        # =====================================================
        # 10. FINAL RESULT
        # =====================================================

        result = {
            "transaction_id": transaction_id,

            "customer_id": customer_id,

            "transaction": transaction,

            "prediction": {
                **prediction,
                "decision": model_decision,
            },

            "risk": {
                **risk_result,
                "risk_level": risk_level,
                "decision": risk_engine_decision,
            },

            "rules": {
                **rules_result,
                "decision": rule_decision,
                "rules_triggered": triggered_rules,
                "high_severity_count":
                    high_severity_count,
            },

            # This is the actual business action.
            "final_decision": final_decision,

            "policy_result": {
                "final_decision":
                    final_decision,
                "model_decision":
                    model_decision,
                "risk_engine_decision":
                    risk_engine_decision,
                "rule_decision":
                    rule_decision,
                "risk_level":
                    risk_level,
                "fraud_probability":
                    fraud_probability,
            },

            "explanation": explanation,

            "shap": shap_result,

            "agent": agent_result,

            "monitoring": {
                "recorded": True,
            },

            "agent_trace": trace,
        }

        # =====================================================
        # 11. PERSISTENCE
        # =====================================================

        try:
            persistence_record = (
                persistence_service.save_decision(
                    transaction_id=transaction_id,
                    customer_id=customer_id,
                    transaction=transaction,
                    prediction=prediction,
                    risk=risk_result,
                    explanation=explanation,
                )
            )

            result["persistence"] = {
                "saved": True,
                "record": persistence_record,
            }

        except Exception as error:
            result["persistence"] = {
                "saved": False,
                "error": str(error),
            }

        # =====================================================
        # 12. AUDIT
        # =====================================================

        audit_event = audit_service.record_decision(
            transaction_id=transaction_id,
            decision_result=result,
        )

        result["audit"] = audit_event

        return result


def make_decision(
    transaction: Dict[str, Any],
    customer_id: str = "anonymous",
) -> Dict[str, Any]:

    service = DecisionService()

    return service.process_transaction(
        transaction=transaction,
        customer_id=customer_id,
    )