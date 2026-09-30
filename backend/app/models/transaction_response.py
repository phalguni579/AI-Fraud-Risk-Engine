from typing import Any, Dict, List

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    fraud_probability: float
    is_fraud: int
    decision: str


class RiskDecisionResponse(BaseModel):
    prediction: PredictionResponse
    risk: Dict[str, Any]
    agent: Dict[str, Any]
    explanation: Dict[str, Any]


class TransactionAnalysisResponse(BaseModel):
    transaction: Dict[str, Any]
    prediction: PredictionResponse
    risk: Dict[str, Any]
    agent: Dict[str, Any]
    explanation: Dict[str, Any]