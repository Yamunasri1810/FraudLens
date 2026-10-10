"""
Tests for FastAPI endpoints, request validation, CSV export, and prediction.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["artifacts_loaded"] is True

def test_overview_endpoint():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "dataset" in data
    assert "selected_model" in data
    assert data["dataset"]["total_transactions"] == 284807
    assert data["selected_model"]["precision_at_200"] > 0.50

def test_analytics_endpoint():
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "dataset_summary" in data
    assert "amount_comparison" in data
    assert "pca_features" in data
    assert "key_insights" in data
    assert len(data["key_insights"]) >= 3
    assert "pca_disclaimer" in data

def test_models_endpoint():
    res = client.get("/api/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "random_forest" in data["models"]
    assert "logistic_regression" in data["models"]

def test_alerts_endpoint():
    res = client.get("/api/alerts?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total_items"] == 200
    assert len(data["items"]) == 10
    first_item = data["items"][0]
    assert first_item["rank"] == 1
    assert "risk_score" in first_item
    assert "priority" in first_item
    assert "review_status" in first_item

def test_alert_detail_endpoint():
    res = client.get("/api/alerts/TXN-000000") # or any from list
    # First get actual first item ID
    alerts_res = client.get("/api/alerts?limit=1")
    first_id = alerts_res.json()["items"][0]["id"]
    
    res = client.get(f"/api/alerts/{first_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["alert"]["id"] == first_id
    assert "investigation_note" in data
    assert data["investigation_note"]["status"] in ["PENDING_APPROVAL", "APPROVED"]

def test_csv_export_endpoint():
    res = client.get("/api/alerts/export?model=random_forest")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    content = res.text
    assert "Rank,Transaction_ID,Time_Seconds,Amount_USD" in content
    lines = content.strip().split("\n")
    assert len(lines) == 201  # Header + 200 rows

def test_predict_endpoint():
    payload = {
        "time": 500.0,
        "amount": 12.50,
        "v_features": {
            "V14": -7.5,
            "V17": -6.2,
            "V12": -5.8,
            "V10": -5.0
        },
        "model": "random_forest"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "risk_score" in data
    assert "priority_tier" in data
    assert data["risk_score"] >= 0.0
    assert data["risk_score"] <= 1.0
    assert "draft_note" in data
    assert data["draft_note"]["status"] == "PENDING_APPROVAL"

def test_capacity_endpoint():
    res = client.get("/api/capacity?k=200&loss_per_fraud=2500&cost_per_investigation=25")
    assert res.status_code == 200
    data = res.json()
    assert data["capacity_k"] == 200
    assert "financial_impact" in data
    assert "random_forest" in data["financial_impact"]
    assert data["financial_impact"]["random_forest"]["frauds_prevented"] >= 100
