"""
FraudLens - Rule-Based Analyst Note Generator
Generates evidence-grounded investigation notes without inventing facts,
customer names, merchants, or geolocation.
Notes strictly initialize with status: PENDING_APPROVAL.
"""

from datetime import datetime, timezone
from typing import Dict, Any

def generate_investigation_note(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an objective, rule-based draft investigation note
    derived strictly from model score, amount, and PCA feature anomalies.
    """
    priority = transaction.get("priority", "MEDIUM")
    risk_score = transaction.get("risk_score", 0.0)
    amount = transaction.get("amount", 0.0)
    time_val = transaction.get("time", 0.0)
    features = transaction.get("top_features", transaction.get("all_features", {}))

    # Evidence points
    evidence = []

    # 1. Risk Tier & Confidence
    score_pct = round(risk_score * 100, 1)
    if priority == "CRITICAL":
        evidence.append(f"Model assigned CRITICAL risk score ({score_pct}% confidence).")
    elif priority == "HIGH":
        evidence.append(f"Model assigned HIGH risk score ({score_pct}% confidence).")
    elif priority == "MEDIUM":
        evidence.append(f"Model assigned MEDIUM risk score ({score_pct}% confidence).")
    else:
        evidence.append(f"Model assigned LOW risk score ({score_pct}% confidence).")

    # 2. Transaction Amount Characterization
    if amount < 15.0:
        evidence.append(f"Transaction amount of ${amount:.2f} aligns with micro-transaction card-testing behavior (median fraud amount is $9.25).")
    elif amount > 500.0:
        evidence.append(f"Transaction amount of ${amount:.2f} represents an elevated exposure level exceeding the 95th percentile of fraud instances.")
    else:
        evidence.append(f"Transaction amount is ${amount:.2f}.")

    # 3. PCA Latent Feature Deviations
    pca_deviations = []
    for f in ["V14", "V17", "V12", "V10"]:
        val = features.get(f)
        if val is not None:
            if val < -3.0:
                pca_deviations.append(f"{f} ({val:.2f}, >3 SD below legitimate centroid)")
            elif val > 3.0:
                pca_deviations.append(f"{f} (+{val:.2f}, outlier elevation)")

    if pca_deviations:
        evidence.append(f"Significant latent PCA feature anomalies detected: {', '.join(pca_deviations)}.")
    else:
        evidence.append("Latent PCA components remain within moderate bounds.")

    # 4. Recommendation & Guardrail
    recommendation = (
        "Recommended next step: Analysts should inspect recent transaction sequence and compare "
        "latent PCA patterns before deciding whether escalation is warranted. "
        "Guardrail: FraudLens is a decision-support prototype. Do not automatically block payments "
        "or contact cardholders without manual analyst sign-off."
    )

    draft_text = " ".join(evidence) + " " + recommendation

    return {
        "status": "PENDING_APPROVAL",
        "text": draft_text,
        "is_approved": False,
        "approved_by": None,
        "approved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "model_confidence_pct": score_pct,
        "priority_level": priority,
    }
