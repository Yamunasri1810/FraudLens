# Production Dockerfile for FraudLens Backend
FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application and pre-trained artifacts
COPY backend /app/backend
COPY ml /app/ml

# Expose port
EXPOSE 8000

# Run uvicorn bound to host-assigned $PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
