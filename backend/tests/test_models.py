"""
Tests for ML protocol: train/test segregation, leakage prevention,
ranking by model score, Precision@200, and Recall@200.
"""

import os
import json
import joblib
import numpy as np
import pytest
from backend.config import ARTIFACTS_DIR

def test_artifacts_exist():
    required = [
        "model_advanced.joblib",
        "model_logistic_regression.joblib",
        "scaler_amount.joblib",
        "evaluation_metrics.json",
        "top200_alerts_advanced.json",
        "curves.json",
    ]
    for r in required:
        p = os.path.join(ARTIFACTS_DIR, r)
        assert os.path.exists(p), f"Artifact {r} missing at {p}"

def test_leakage_prevention_and_split():
    metrics_path = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
    
    proto = metrics["evaluation_protocol"]
    assert proto["dataset_rows"] == 284807
    assert proto["train_rows"] == 213605
    assert proto["test_rows"] == 71202
    assert proto["test_split_pct"] == 25.0
    assert proto["test_fraud_count"] == 123
    assert proto["train_fraud_count"] == 369
    assert proto["total_fraud_count"] == 492
    
    # Check scaler is RobustScaler
    scaler = joblib.load(os.path.join(ARTIFACTS_DIR, "scaler_amount.joblib"))
    assert hasattr(scaler, "center_")
    assert hasattr(scaler, "scale_")

def test_all_negative_baseline():
    metrics_path = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
    
    all_neg = metrics["models"]["all_negative"]
    assert all_neg["accuracy"] >= 0.998  # ~99.83%
    assert all_neg["fraud_in_top_200"] == 0
    assert all_neg["precision_at_200"] == 0.0
    assert all_neg["recall_at_200"] == 0.0

def test_top200_ranking_strictly_by_score():
    alerts_path = os.path.join(ARTIFACTS_DIR, "top200_alerts_advanced.json")
    with open(alerts_path, "r") as f:
        alerts = json.load(f)
    
    assert len(alerts) == 200
    
    # Check monotonically non-increasing risk scores
    scores = [a["risk_score"] for a in alerts]
    assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1)), "Queue must be sorted strictly by risk_score descending"
    
    # Check ranks 1 to 200
    ranks = [a["rank"] for a in alerts]
    assert ranks == list(range(1, 201))

def test_precision_recall_at_200_math():
    alerts_path = os.path.join(ARTIFACTS_DIR, "top200_alerts_advanced.json")
    with open(alerts_path, "r") as f:
        alerts = json.load(f)
    
    actual_frauds = sum(1 for a in alerts if a["is_fraud_ground_truth"] == 1)
    
    metrics_path = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
    
    rf = metrics["models"]["random_forest"]
    assert rf["fraud_in_top_200"] == actual_frauds
    
    expected_p200 = round(actual_frauds / 200.0, 4)
    expected_r200 = round(actual_frauds / 123.0, 4)
    
    assert rf["precision_at_200"] == expected_p200
    assert rf["recall_at_200"] == expected_r200
