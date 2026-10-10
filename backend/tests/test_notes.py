"""
Tests for rule-based investigation note generation and approval lifecycle.
"""

import pytest
from backend.note_generator import generate_investigation_note
from backend.storage import save_note, get_review, update_review_status

def test_note_generator_defaults_to_pending_approval():
    mock_txn = {
        "priority": "CRITICAL",
        "risk_score": 0.942,
        "amount": 11.50,
        "top_features": {"V14": -7.1, "V17": -6.8, "V12": -5.9, "V10": -5.2}
    }
    note = generate_investigation_note(mock_txn)
    
    assert note["status"] == "PENDING_APPROVAL"
    assert note["is_approved"] is False
    assert note["approved_by"] is None
    assert "CRITICAL" in note["text"]
    assert "micro-transaction" in note["text"]
    assert "V14" in note["text"]
    assert "decision-support prototype" in note["text"]

def test_note_persistence_and_approval():
    test_id = "TXN-TEST-999"
    
    # Save initial pending note
    save_note(
        alert_id=test_id,
        note_text="Initial automated investigation draft.",
        note_status="PENDING_APPROVAL"
    )
    
    saved = get_review(test_id)
    assert saved is not None
    assert saved["note_status"] == "PENDING_APPROVAL"
    assert saved["note_text"] == "Initial automated investigation draft."
    
    # Approve note
    save_note(
        alert_id=test_id,
        note_text="Analyst reviewed and confirmed anomaly pattern. Escalated to Tier 2.",
        note_status="APPROVED",
        approved_by="Analyst_J_Smith"
    )
    
    approved = get_review(test_id)
    assert approved["note_status"] == "APPROVED"
    assert approved["approved_by"] == "Analyst_J_Smith"
    assert "Analyst reviewed" in approved["note_text"]

def test_review_status_update():
    test_id = "TXN-TEST-999"
    update_review_status(test_id, "Under Review")
    rev = get_review(test_id)
    assert rev["review_status"] == "Under Review"
    
    update_review_status(test_id, "Confirmed Fraud")
    rev = get_review(test_id)
    assert rev["review_status"] == "Confirmed Fraud"
