"""
FraudLens Backend Configuration
"""

import os

PORT = int(os.environ.get("PORT", 8000))
ENV = os.environ.get("ENV", "development")

# CORS Origins
raw_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]

ARTIFACTS_DIR = os.environ.get(
    "ARTIFACTS_DIR",
    os.path.join(os.path.dirname(__file__), "artifacts")
)

DATA_PATH = os.environ.get(
    "DATA_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "creditcard.csv")
)
