from typing import List

from fastapi import APIRouter, HTTPException

from backend.app.agents.llm_risk_agent import (
    run_llm_risk_agent,
)
from backend.app.models.agent_decision_response import (
    AgentDecisionResponse,
)
from backend.app.models.agent_trace_response import (
    AgentTraceResponse,
)
from backend.app.models.customer import Customer
from backend.app.models.customer_response import (
    CustomerResponse,
)
from backend.app.models.decision_request import (
    DecisionRequest,
)
from backend.app.models.decision_response import (
    DecisionResponse,
)
from backend.app.models.llm_agent_response import (
    LLMAgentResponse,
)
from backend.app.models.monitoring_response import (
    DriftResponse,
    ModelHealthResponse,
    RiskDistributionResponse,
)
from backend.app.models.performance_response import (
    ModelPerformanceResponse,
)
from backend.app.models.transaction import (
    Transaction,
)
from backend.app.models.transaction_history_response import (
    TransactionHistoryResponse,
)
from backend.app.services.agent_decision_service import (
    investigate_transaction,
)
from backend.app.services.agent_trace_service import (
    agent_trace_service,
)
from backend.app.services.audit_service import (
    audit_service,
)
from backend.app.services.customer_service import (
    customer_service,
)
from backend.app.services.decision_service import (
    make_decision,
)
from backend.app.services.monitoring_service import (
    monitoring_service,
)
from backend.app.services.performance_service import (
    performance_service,
)
from backend.app.services.transaction_history_service import (
    transaction_history_service,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["Fraud Risk Engine"],
)


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "fraud-risk-engine",
        "version": "1.0.0",
    }


# =========================================================
# COMPLETE DECISION
# =========================================================

@router.post(
    "/decision",
    response_model=DecisionResponse,
)
def create_decision(
    request: DecisionRequest,
):
    """
    Runs the complete fraud-risk decision pipeline
    and records the transaction in customer history.
    """

    try:
        transaction_data = request.transaction.model_dump()
        customer_id = request.customer_id

        # -------------------------------------------------
        # Run complete fraud-risk decision pipeline
        # -------------------------------------------------

        result = make_decision(
            transaction=transaction_data,
            customer_id=customer_id,
        )

        # -------------------------------------------------
        # Add transaction to customer history
        # -------------------------------------------------

        history_record = (
            transaction_history_service.add_transaction(
                customer_id=customer_id,
                transaction={
                    **transaction_data,
                    "transaction_id": result.get(
                        "transaction_id"
                    ),
                    "fraud_probability": result.get(
                        "prediction",
                        {},
                    ).get(
                        "fraud_probability",
                        0,
                    ),
                    "risk_level": result.get(
                        "risk",
                        {},
                    ).get(
                        "risk_level",
                        "UNKNOWN",
                    ),
                    "decision": result.get(
                        "final_decision",
                        "UNKNOWN",
                    ),
                },
            )
        )

        # -------------------------------------------------
        # Attach history information to response
        # -------------------------------------------------

        result["history"] = {
            "saved": True,
            "record": history_record,
        }

        return result

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Decision pipeline failed: {str(error)}"
            ),
        )


# =========================================================
# AGENT INVESTIGATION
# =========================================================

@router.post(
    "/agent/investigate",
    response_model=AgentDecisionResponse,
)
def investigate(
    customer_id: str,
    transaction: Transaction,
):
    """
    Runs deterministic agent investigation.
    """

    try:
        return investigate_transaction(
            customer_id=customer_id,
            transaction=transaction.model_dump(),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Agent investigation failed: {str(error)}"
            ),
        )


# =========================================================
# AI AGENT INVESTIGATION
# =========================================================

@router.post(
    "/agent/ai-investigate",
    response_model=LLMAgentResponse,
)
def ai_investigate(
    customer_id: str,
    transaction: Transaction,
):
    """
    Runs the AI fraud investigation agent.
    """

    try:
        return run_llm_risk_agent(
            customer_id=customer_id,
            transaction=transaction.model_dump(),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI agent failed: {str(error)}",
        )


# =========================================================
# CUSTOMER
# =========================================================

@router.post("/customers")
def create_customer(
    customer: Customer,
):
    """
    Creates or updates a customer profile.
    """

    try:
        return customer_service.add_customer(
            customer_id=customer.customer_id,
            customer_data=customer.model_dump(
                exclude={"customer_id"}
            ),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Customer creation failed: {str(error)}"
            ),
        )


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: str,
):
    """
    Returns customer risk context.
    """

    customer = customer_service.get_customer(
        customer_id
    )

    if not customer:
        return CustomerResponse(
            customer_id=customer_id,
            exists=False,
            profile=None,
            risk_context={},
        )

    risk_context = (
        customer_service.get_customer_risk_context(
            customer_id
        )
    )

    return CustomerResponse(
        customer_id=customer_id,
        exists=True,
        profile=customer,
        risk_context=risk_context.get(
            "risk_context",
            {},
        ),
    )


# =========================================================
# TRANSACTION HISTORY
# =========================================================

@router.post(
    "/customers/{customer_id}/transactions"
)
def add_transaction(
    customer_id: str,
    transaction: Transaction,
):
    """
    Adds a transaction to customer history.
    """

    try:
        return (
            transaction_history_service.add_transaction(
                customer_id=customer_id,
                transaction=transaction.model_dump(),
            )
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Transaction storage failed: {str(error)}"
            ),
        )


@router.get(
    "/customers/{customer_id}/transactions",
    response_model=TransactionHistoryResponse,
)
def get_transaction_history(
    customer_id: str,
    limit: int = 10,
):
    """
    Returns recent customer transactions.
    """

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100.",
        )

    history = (
        transaction_history_service.get_history(
            customer_id=customer_id,
            limit=limit,
        )
    )

    return TransactionHistoryResponse(
        customer_id=customer_id,
        transaction_count=len(history),
        transactions=history,
    )


# =========================================================
# MODEL MONITORING
# =========================================================

@router.get(
    "/monitoring/health",
    response_model=ModelHealthResponse,
)
def model_health():
    """
    Returns model prediction health statistics.
    """

    return monitoring_service.get_model_health()


@router.get(
    "/monitoring/distribution",
    response_model=RiskDistributionResponse,
)
def risk_distribution():
    """
    Returns current prediction risk distribution.
    """

    return monitoring_service.get_risk_distribution()


@router.post(
    "/monitoring/drift",
    response_model=DriftResponse,
)
def prediction_drift(
    baseline_probabilities: List[float],
):
    """
    Checks prediction distribution drift.
    """

    if not baseline_probabilities:
        raise HTTPException(
            status_code=400,
            detail=(
                "Baseline probabilities "
                "cannot be empty."
            ),
        )

    return monitoring_service.check_drift(
        baseline_probabilities
    )


@router.get(
    "/monitoring/performance",
    response_model=ModelPerformanceResponse,
)
def model_performance():
    """
    Returns latest model performance metrics.
    """

    return performance_service.get_latest_performance()


# =========================================================
# AUDIT
# =========================================================

@router.get("/audit")
def get_audit_events():
    """
    Returns recorded decision audit events.
    """

    return {
        "total_events": (
            audit_service.get_event_count()
        ),
        "events": audit_service.get_events(),
    }


# =========================================================
# AGENT TRACE
# =========================================================

@router.get(
    "/agent/trace/{transaction_id}",
    response_model=AgentTraceResponse,
)
def get_agent_trace(
    transaction_id: str,
):
    """
    Returns the investigation trace
    for a transaction.
    """

    steps = agent_trace_service.get_trace(
        transaction_id
    )

    return AgentTraceResponse(
        transaction_id=transaction_id,
        steps=steps,
        total_steps=len(steps),
    )