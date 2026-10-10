"""
FraudLens - Model Evaluation & Methodology Router
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.config import ARTIFACTS_DIR

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])

def load_json(name: str):
    p = os.path.join(ARTIFACTS_DIR, name)
    if not os.path.exists(p):
        raise HTTPException(status_code=503, detail=f"Artifact {name} not found.")
    with open(p, "r") as f:
        return json.load(f)

@router.get("")
def get_evaluation():
    """
    Returns comprehensive evaluation curves (PR and ROC), confusion matrices,
    and methodology explanations regarding class imbalance and leakage prevention.
    """
    metrics = load_json("evaluation_metrics.json")
    curves = load_json("curves.json")

    methodology = {
        "class_imbalance": {
            "title": "Handling Extreme Class Imbalance (0.173% Fraud Prevalence)",
            "explanation": (
                "In extreme fraud imbalance (1 fraud per ~580 legitimate transactions), traditional accuracy is completely deceptive: "
                "an all-negative baseline achieves 99.83% accuracy while catching zero fraud cases. Similarly, standard ROC-AUC can remain "
                "artificially high (e.g. >0.97) because the enormous pool of true negatives depresses the false positive rate (FPR = FP / (FP + TN)). "
                "Therefore, Average Precision (PR-AUC) is the primary metric, measuring precision directly against recall across all thresholds."
            )
        },
        "leakage_prevention": {
            "title": "Strict Data Leakage Prevention Protocol",
            "explanation": (
                "1. Stratified Splitting: The 284,807-row dataset was split into 75% train and 25% test before any scaling or transformations.\n"
                "2. Training-Only Scaling: RobustScaler was fitted exclusively on the 213,605 training transactions; test set Amount values were transformed using training parameters.\n"
                "3. Target Exclusion: The Class variable was strictly excluded from all feature sets.\n"
                "4. Held-Out Test Set Untouched: Model selection and hyperparameter tuning were conducted without modifying or peeking at test labels."
            )
        },
        "average_precision_vs_trapezoid": {
            "title": "Average Precision vs Numerical Trapezoidal PR-AUC",
            "explanation": (
                "Average Precision (AP) calculates the weighted mean of precisions achieved at each recall threshold step (sum of (R_k - R_{k-1}) * P_k). "
                "In contrast, generic numerical trapezoidal integration (like np.trapz on precision-recall points) tends to systematically overestimate "
                "the true area under the precision-recall curve due to linear interpolation across non-linear precision jumps."
            )
        }
    }

    return {
        "models": metrics["models"],
        "evaluation_protocol": metrics["evaluation_protocol"],
        "curves": curves,
        "methodology": methodology,
    }
