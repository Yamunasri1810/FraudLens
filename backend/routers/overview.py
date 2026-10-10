"""
FraudLens - Overview Dashboard Router
"""

import os
import json
from fastapi import APIRouter, HTTPException, Query
from backend.config import ARTIFACTS_DIR
from backend.storage import get_recent_reviews, get_all_reviews

router = APIRouter(prefix="/api/overview", tags=["Overview"])

def load_json_artifact(filename: str):
    path = os.path.join(ARTIFACTS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail=f"Artifact {filename} missing. Please train the model using 'python ml/train.py'."
        )
    with open(path, "r") as f:
        return json.load(f)

@router.get("")
def get_overview(model: str = Query("random_forest", pattern="^(random_forest|logistic_regression)$")):
    """
    Returns high-level platform summary, top-200 operational metrics,
    fraud prevalence, and analyst review stats.
    """
    metrics = load_json_artifact("evaluation_metrics.json")
    eda = load_json_artifact("eda_insights.json")
    model_data = metrics["models"].get(model)
    if not model_data:
        raise HTTPException(status_code=400, detail=f"Model '{model}' not found.")

    all_reviews = get_all_reviews()
    reviewed_count = len(all_reviews)
    confirmed_fraud_count = sum(1 for r in all_reviews.values() if r.get("review_status") == "Confirmed Fraud")
    legitimate_cleared_count = sum(1 for r in all_reviews.values() if r.get("review_status") == "Legitimate")
    under_review_count = sum(1 for r in all_reviews.values() if r.get("review_status") == "Under Review")

    recent_activity = get_recent_reviews(limit=5)

    return {
        "dataset": {
            "total_transactions": eda["dataset_summary"]["total_transactions"],
            "test_transactions": metrics["evaluation_protocol"]["test_rows"],
            "fraud_prevalence_pct": eda["dataset_summary"]["fraud_prevalence_pct"],
            "test_actual_frauds": metrics["evaluation_protocol"]["test_fraud_count"],
        },
        "selected_model": {
            "id": model,
            "name": model_data["name"],
            "type": model_data["type"],
            "average_precision": model_data["average_precision"],
            "roc_auc": model_data["roc_auc"],
            "precision_at_200": model_data["precision_at_200"],
            "recall_at_200": model_data["recall_at_200"],
            "fraud_in_top_200": model_data["fraud_in_top_200"],
            "description": model_data["description"],
        },
        "capacity_k": 200,
        "investigation_summary": {
            "queue_size": 200,
            "reviewed_count": reviewed_count,
            "confirmed_fraud_count": confirmed_fraud_count,
            "legitimate_cleared_count": legitimate_cleared_count,
            "under_review_count": under_review_count,
            "pending_count": max(0, 200 - reviewed_count),
        },
        "recent_analyst_activity": recent_activity,
    }
