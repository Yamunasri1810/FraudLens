"""
FraudLens - Capacity Simulator & Cost-Impact ROI Router
"""

import os
import json
from fastapi import APIRouter, HTTPException, Query
from backend.config import ARTIFACTS_DIR

router = APIRouter(prefix="/api/capacity", tags=["Capacity & ROI"])

def load_capacity_data():
    path = os.path.join(ARTIFACTS_DIR, "capacity_curves.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=503, detail="Capacity curves artifact missing.")
    with open(path, "r") as f:
        return json.load(f)

@router.get("")
def get_capacity_analysis(
    k: int = Query(200, ge=10, le=1000, description="Investigation capacity K"),
    loss_per_fraud: float = Query(2500.0, ge=0.0, description="Hypothetical average loss per missed fraud case in USD"),
    cost_per_investigation: float = Query(25.0, ge=0.0, description="Hypothetical cost per manual investigation in USD")
):
    """
    Returns Precision@K and Recall@K for specified capacity K, along with
    an illustrative financial cost-impact and ROI breakdown.
    """
    capacity_data = load_capacity_data()

    # Find closest entry or interpolate
    exact_entry = next((item for item in capacity_data if item["k"] == k), None)
    if not exact_entry:
        # Fallback to closest
        exact_entry = min(capacity_data, key=lambda x: abs(x["k"] - k))

    total_test_frauds = 123  # Known 25% test set frauds

    # Calculate financial simulations for Random Forest (primary model)
    rf_caught = exact_entry["rf_frauds_caught"]
    rf_missed = max(0, total_test_frauds - rf_caught)
    rf_investigation_cost = k * cost_per_investigation
    rf_fraud_loss_prevented = rf_caught * loss_per_fraud
    rf_net_savings = rf_fraud_loss_prevented - rf_investigation_cost
    rf_roi_ratio = round(rf_fraud_loss_prevented / rf_investigation_cost, 2) if rf_investigation_cost > 0 else 0.0

    # Calculate for Logistic Regression
    lr_caught = exact_entry["lr_frauds_caught"]
    lr_missed = max(0, total_test_frauds - lr_caught)
    lr_investigation_cost = k * cost_per_investigation
    lr_fraud_loss_prevented = lr_caught * loss_per_fraud
    lr_net_savings = lr_fraud_loss_prevented - lr_investigation_cost
    lr_roi_ratio = round(lr_fraud_loss_prevented / lr_investigation_cost, 2) if lr_investigation_cost > 0 else 0.0

    # Random / Unprioritized triage comparison (baseline where analyst picks K random transactions)
    random_precision = 123 / 71202.0
    random_caught = int(round(k * random_precision))
    random_prevented = random_caught * loss_per_fraud
    random_net_savings = random_prevented - rf_investigation_cost

    return {
        "capacity_k": k,
        "matched_k": exact_entry["k"],
        "total_evaluation_frauds": total_test_frauds,
        "metrics_at_k": exact_entry,
        "cost_assumptions": {
            "loss_per_missed_fraud": loss_per_fraud,
            "cost_per_investigation": cost_per_investigation,
        },
        "financial_impact": {
            "random_forest": {
                "frauds_prevented": rf_caught,
                "frauds_missed": rf_missed,
                "investigation_expense": round(rf_investigation_cost, 2),
                "fraud_loss_prevented": round(rf_fraud_loss_prevented, 2),
                "net_financial_benefit": round(rf_net_savings, 2),
                "roi_multiple": rf_roi_ratio,
            },
            "logistic_regression": {
                "frauds_prevented": lr_caught,
                "frauds_missed": lr_missed,
                "investigation_expense": round(lr_investigation_cost, 2),
                "fraud_loss_prevented": round(lr_fraud_loss_prevented, 2),
                "net_financial_benefit": round(lr_net_savings, 2),
                "roi_multiple": lr_roi_ratio,
            },
            "unprioritized_random_sampling": {
                "frauds_prevented": random_caught,
                "frauds_missed": total_test_frauds - random_caught,
                "investigation_expense": round(rf_investigation_cost, 2),
                "fraud_loss_prevented": round(random_prevented, 2),
                "net_financial_benefit": round(random_net_savings, 2),
            }
        },
        "all_capacity_points": capacity_data,
        "disclaimer": "All financial outputs are illustrative hypothetical estimates based on supplied cost assumptions, not guaranteed balance-sheet savings."
    }
