"""
FraudLens - Review & Note Persistence Storage
Uses SQLite with local file or in-memory fallback for lightweight, zero-dependency persistence.
Stores analyst decisions, review statuses, and investigation notes.
"""

import os
import sqlite3
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

DB_PATH = os.environ.get("FRAUDLENS_DB_PATH", os.path.join(os.path.dirname(__file__), "data", "reviews.db"))

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                alert_id TEXT PRIMARY KEY,
                review_status TEXT NOT NULL DEFAULT 'Pending',
                note_text TEXT,
                note_status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
                approved_by TEXT,
                updated_at TEXT NOT NULL
            )
        """)
    conn.close()

def get_review(alert_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews WHERE alert_id = ?", (alert_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_all_reviews() -> Dict[str, Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews")
    rows = cursor.fetchall()
    conn.close()
    return {row["alert_id"]: dict(row) for row in rows}

def update_review_status(alert_id: str, status: str) -> Dict[str, Any]:
    valid_statuses = {"Pending", "Under Review", "Confirmed Fraud", "Legitimate"}
    if status not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Must be one of {valid_statuses}")

    conn = get_connection()
    now_iso = datetime.now(timezone.utc).isoformat()
    with conn:
        # Check if row exists
        cursor = conn.cursor()
        cursor.execute("SELECT alert_id FROM reviews WHERE alert_id = ?", (alert_id,))
        exists = cursor.fetchone()
        if exists:
            cursor.execute(
                "UPDATE reviews SET review_status = ?, updated_at = ? WHERE alert_id = ?",
                (status, now_iso, alert_id),
            )
        else:
            cursor.execute(
                "INSERT INTO reviews (alert_id, review_status, note_status, updated_at) VALUES (?, ?, 'PENDING_APPROVAL', ?)",
                (alert_id, status, now_iso),
            )
    conn.close()
    return get_review(alert_id)

def save_note(alert_id: str, note_text: str, note_status: str = "PENDING_APPROVAL", approved_by: Optional[str] = None) -> Dict[str, Any]:
    valid_note_statuses = {"PENDING_APPROVAL", "APPROVED"}
    if note_status not in valid_note_statuses:
        raise ValueError(f"Invalid note_status '{note_status}'. Must be one of {valid_note_statuses}")

    conn = get_connection()
    now_iso = datetime.now(timezone.utc).isoformat()
    with conn:
        cursor = conn.cursor()
        cursor.execute("SELECT alert_id, review_status FROM reviews WHERE alert_id = ?", (alert_id,))
        exists = cursor.fetchone()
        if exists:
            cursor.execute(
                """UPDATE reviews 
                   SET note_text = ?, note_status = ?, approved_by = ?, updated_at = ? 
                   WHERE alert_id = ?""",
                (note_text, note_status, approved_by, now_iso, alert_id),
            )
        else:
            cursor.execute(
                """INSERT INTO reviews (alert_id, review_status, note_text, note_status, approved_by, updated_at) 
                   VALUES (?, 'Pending', ?, ?, ?, ?)""",
                (alert_id, note_text, note_status, approved_by, now_iso),
            )
    conn.close()
    return get_review(alert_id)

def get_recent_reviews(limit: int = 10) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews ORDER BY updated_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Initialize tables upon module load
init_db()
