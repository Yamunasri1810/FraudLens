"""
FraudLens - Transaction Analytics & EDA Insights Router
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.config import ARTIFACTS_DIR

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
def get_analytics():
    """
    Returns Exploratory Data Analysis distributions, PCA feature divergence,
    hourly cycles, and 3 dynamically derived EDA insights.
    """
    path = os.path.join(ARTIFACTS_DIR, "eda_insights.json")
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail="EDA insights artifact missing. Run 'python ml/train.py' to generate."
        )
    with open(path, "r") as f:
        data = json.load(f)

    # Add explanatory note regarding PCA anonymization
    data["pca_disclaimer"] = (
        "Features V1 through V28 are numerical components obtained via Principal Component Analysis (PCA) "
        "transformation to safeguard customer privacy. They do not directly reveal merchant identity, physical "
        "location, or device metadata. However, their statistical deviations provide strong latent indicators of "
        "fraudulent behavior."
    )
    return data
