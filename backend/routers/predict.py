"""
FraudLens - Real-Time Transaction Scoring Router
Scores supplied transaction features without leaking ground-truth labels.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.config import ARTIFACTS_DIR
from backend.note_generator import generate_investigation_note

router = APIRouter(prefix="/api/predict", tags=["Prediction"])

# Feature names in the exact order expected by the models
FEATURE_ORDER = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]

class TransactionPayload(BaseModel):
    time: float = Field(default=0.0, description="Seconds elapsed since reference start")
    amount: float = Field(..., ge=0.0, description="Transaction amount in USD")
    v_features: Dict[str, float] = Field(..., description="Map of PCA components V1 through V28")
    model: Optional[str] = Field(default="random_forest", description="random_forest or logistic_regression")

@router.post("")
def predict_transaction(payload: TransactionPayload):
    """
    Scores a single transaction, produces risk probability, risk tier,
    latent PCA anomaly summary, and a human-in-the-loop draft note.
    """
    model_file = "model_advanced.joblib" if payload.model == "random_forest" else "model_logistic_regression.joblib"
    model_path = os.path.join(ARTIFACTS_DIR, model_file)
    scaler_path = os.path.join(ARTIFACTS_DIR, "scaler_amount.joblib")

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise HTTPException(
            status_code=503,
            detail="Model or scaler artifact missing. Run 'python ml/train.py' to generate."
        )

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    # Construct feature row
    row_dict = {"Time": payload.time}
    for i in range(1, 29):
        key = f"V{i}"
        row_dict[key] = float(payload.v_features.get(key, 0.0))
    row_dict["Amount"] = float(payload.amount)

    input_df = pd.DataFrame([row_dict])[FEATURE_ORDER]

    # Preprocess Amount using the fitted scaler
    input_df_scaled = input_df.copy()
    input_df_scaled["Amount"] = scaler.transform(input_df[["Amount"]])

    # Model Inference
    probs = model.predict_proba(input_df_scaled)[0]
    fraud_prob = float(probs[1])

    if fraud_prob >= 0.85:
        priority = "CRITICAL"
    elif fraud_prob >= 0.65:
        priority = "HIGH"
    elif fraud_prob >= 0.40:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    # Latent PCA checks for top predictive features
    top_pca_keys = ["V14", "V17", "V12", "V10"]
    deviations = {k: round(float(payload.v_features.get(k, 0.0)), 3) for k in top_pca_keys}

    transaction_summary = {
        "amount": payload.amount,
        "time": payload.time,
        "risk_score": fraud_prob,
        "priority": priority,
        "top_features": deviations,
    }

    # Generate rule-based draft note
    draft_note = generate_investigation_note(transaction_summary)

    return {
        "risk_score": round(fraud_prob, 4),
        "risk_percentage": round(fraud_prob * 100, 2),
        "priority_tier": priority,
        "model_used": payload.model,
        "key_feature_deviations": deviations,
        "draft_note": draft_note,
        "decision_support_notice": (
            "This model score is a prioritized risk assessment, not proof of fraud. "
            "Do not automatically decline transactions without analyst verification."
        )
    }
