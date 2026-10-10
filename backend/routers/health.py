"""
FraudLens - Health & System Diagnostics Router
"""

import os
from fastapi import APIRouter
from backend.config import ARTIFACTS_DIR

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """
    Returns API status, artifact presence, and system readiness.
    """
    artifacts_expected = [
        "model_advanced.joblib",
        "model_logistic_regression.joblib",
        "scaler_amount.joblib",
        "evaluation_metrics.json",
        "top200_alerts_advanced.json",
        "eda_insights.json",
    ]
    missing = [
        f for f in artifacts_expected 
        if not os.path.exists(os.path.join(ARTIFACTS_DIR, f))
    ]

    status = "healthy" if not missing else "degraded"

    return {
        "status": status,
        "service": "FraudLens API",
        "version": "1.0.0",
        "artifacts_loaded": len(missing) == 0,
        "missing_artifacts": missing,
        "message": "FraudLens backend is operational" if not missing else f"Missing artifacts: {missing}. Run 'python ml/train.py' to generate."
    }
