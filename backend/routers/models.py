"""
FraudLens - Models Registry & Evaluation Comparison Router
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.config import ARTIFACTS_DIR

router = APIRouter(prefix="/api/models", tags=["Models"])

@router.get("")
def get_models():
    """
    Returns available models, comparative metrics, hyperparameters, and feature importances.
    """
    path = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail="Model metrics missing. Run 'python ml/train.py' to generate."
        )
    with open(path, "r") as f:
        metrics = json.load(f)

    return {
        "evaluation_protocol": metrics["evaluation_protocol"],
        "models": metrics["models"],
        "feature_importances": metrics.get("feature_importances", [])[:15],
    }
