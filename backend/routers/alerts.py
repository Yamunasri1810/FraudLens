"""
FraudLens - Smart Alert Queue & Investigation Router
"""

import os
import io
import csv
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field
from backend.config import ARTIFACTS_DIR
from backend.storage import (
    get_all_reviews,
    get_review,
    update_review_status,
    save_note,
)
from backend.note_generator import generate_investigation_note

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

def load_alerts(model: str = "random_forest"):
    filename = "top200_alerts_advanced.json" if model == "random_forest" else "top200_alerts_lr.json"
    path = os.path.join(ARTIFACTS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail=f"Alert queue artifact for '{model}' missing. Run 'python ml/train.py' to generate."
        )
    with open(path, "r") as f:
        return json.load(f)

class ReviewStatusUpdate(BaseModel):
    review_status: str = Field(..., description="Pending, Under Review, Confirmed Fraud, or Legitimate")

class NoteUpdate(BaseModel):
    note_text: str = Field(..., min_length=5, description="Investigation note content")
    note_status: str = Field(default="PENDING_APPROVAL", description="PENDING_APPROVAL or APPROVED")
    approved_by: Optional[str] = Field(default=None, description="Analyst identifier")

@router.get("")
def get_alerts(
    model: str = Query("random_forest", pattern="^(random_forest|logistic_regression)$"),
    capacity: int = Query(200, ge=10, le=500),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    priority: Optional[str] = Query(None, pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$"),
    review_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    time_window_hours: Optional[int] = Query(None, description="Simulate time-window filtering (e.g. 12 or 24 hrs)")
):
    """
    Returns ranked alert queue sorted by model-predicted risk score,
    merged with analyst review statuses and pagination.
    """
    alerts = load_alerts(model)
    alerts = alerts[:capacity]

    # Merge persistent review data
    saved_reviews = get_all_reviews()
    for item in alerts:
        rev = saved_reviews.get(item["id"])
        if rev:
            item["review_status"] = rev.get("review_status", item["review_status"])
            item["note_status"] = rev.get("note_status", "PENDING_APPROVAL")
            item["has_note"] = bool(rev.get("note_text"))
        else:
            item["note_status"] = "PENDING_APPROVAL"
            item["has_note"] = False

    # Apply Filters
    filtered = alerts
    if priority:
        filtered = [a for a in filtered if a["priority"] == priority]
    if review_status:
        filtered = [a for a in filtered if a["review_status"].lower() == review_status.lower()]
    if search:
        s = search.strip().lower()
        filtered = [
            a for a in filtered 
            if s in a["id"].lower() or s in str(a["amount"])
        ]
    if time_window_hours is not None and time_window_hours > 0:
        window_seconds = time_window_hours * 3600
        # For simulation, pick transactions within the first N hours
        filtered = [a for a in filtered if a["time"] <= window_seconds]

    total_count = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_items = filtered[start_idx:end_idx]

    # Summary statistics for currently loaded capacity
    actual_frauds_in_queue = sum(1 for a in alerts if a.get("is_fraud_ground_truth") == 1)
    precision_at_k = round(actual_frauds_in_queue / float(len(alerts)), 4) if alerts else 0.0

    return {
        "model": model,
        "capacity_k": len(alerts),
        "total_items": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if limit else 1,
        "queue_precision_at_capacity": precision_at_k,
        "actual_fraud_count_in_capacity": actual_frauds_in_queue,
        "items": paginated_items,
        "disclaimer": "Queue is ordered strictly by model-predicted risk score. Ground truth labels are for offline validation only."
    }

@router.get("/export")
def export_alerts_csv(model: str = Query("random_forest", pattern="^(random_forest|logistic_regression)$")):
    """
    Exports the ranked Top-200 alert queue as a CSV file.
    """
    alerts = load_alerts(model)
    saved_reviews = get_all_reviews()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank",
        "Transaction_ID",
        "Time_Seconds",
        "Amount_USD",
        "Risk_Score",
        "Priority_Tier",
        "Review_Status",
        "Note_Approval_Status",
        "Evaluation_Ground_Truth_Class",
        "Model_Name"
    ])

    for a in alerts:
        rev = saved_reviews.get(a["id"])
        current_status = rev.get("review_status", a["review_status"]) if rev else a["review_status"]
        current_note_status = rev.get("note_status", "PENDING_APPROVAL") if rev else "PENDING_APPROVAL"

        writer.writerow([
            a["rank"],
            a["id"],
            a["time"],
            a["amount"],
            f"{a['risk_score']:.4f}",
            a["priority"],
            current_status,
            current_note_status,
            a.get("is_fraud_ground_truth", "N/A"),
            a["model"]
        ])

    csv_data = output.getvalue()
    filename = f"fraudlens_top200_{model}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{alert_id}")
def get_alert_detail(
    alert_id: str,
    model: str = Query("random_forest", pattern="^(random_forest|logistic_regression)$")
):
    """
    Returns deep-dive transaction inspection details, latent PCA deviations,
    and investigation note draft or approved state.
    """
    alerts = load_alerts(model)
    target = None
    for a in alerts:
        if a["id"].upper() == alert_id.upper():
            target = a
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Transaction alert '{alert_id}' not found in top queue.")

    rev = get_review(target["id"])
    if rev:
        review_status = rev.get("review_status", target["review_status"])
        note_text = rev.get("note_text")
        note_status = rev.get("note_status", "PENDING_APPROVAL")
        approved_by = rev.get("approved_by")
        updated_at = rev.get("updated_at")
    else:
        review_status = target["review_status"]
        note_text = None
        note_status = "PENDING_APPROVAL"
        approved_by = None
        updated_at = None

    # If no note exists in DB yet, generate initial rule-based draft
    if not note_text:
        draft = generate_investigation_note(target)
        note_text = draft["text"]
        note_status = draft["status"]

    return {
        "alert": target,
        "review_status": review_status,
        "investigation_note": {
            "text": note_text,
            "status": note_status,
            "approved_by": approved_by,
            "updated_at": updated_at,
        },
        "safety_disclaimer": "FraudLens is a human-in-the-loop decision-support prototype. Do not automatically block payments or contact cardholders without manual verification."
    }

@router.patch("/{alert_id}/review")
def update_alert_review(alert_id: str, payload: ReviewStatusUpdate):
    """
    Updates the analyst review status for an alert.
    """
    try:
        updated = update_review_status(alert_id.upper(), payload.review_status)
        return {
            "success": True,
            "alert_id": alert_id.upper(),
            "review": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{alert_id}/note")
def update_alert_note(alert_id: str, payload: NoteUpdate):
    """
    Saves an edited investigation note and optionally marks it APPROVED.
    """
    try:
        updated = save_note(
            alert_id=alert_id.upper(),
            note_text=payload.note_text,
            note_status=payload.note_status,
            approved_by=payload.approved_by
        )
        return {
            "success": True,
            "alert_id": alert_id.upper(),
            "review": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
