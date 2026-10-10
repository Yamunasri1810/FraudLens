# FraudLens Backend — FastAPI Decision Support Service

The FraudLens backend is a production-grade FastAPI service designed to score credit card transactions, rank daily investigation alert queues, serve empirical EDA telemetry, and persist human analyst review decisions.

## Architecture

- **Framework**: FastAPI (Asynchronous Python 3.10+)
- **Machine Learning**: Scikit-Learn (`RandomForestClassifier`, `LogisticRegression`, `RobustScaler`)
- **Persistence**: SQLite with local zero-config engine (`backend/data/reviews.db`)
- **Data Protocols**: Stratified 75/25 split, leakage-free training-only scaling, target exclusion

## Quickstart

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Run Leakage-Free ML Training Pipeline (if artifacts are missing)
```bash
python ml/train.py
```
This trains the baseline and advanced models, calculates PR/ROC curves, generates the top-200 alert queues, and saves serialized artifacts into `backend/artifacts/`.

### 3. Start the API Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### 4. Run Backend Test Suite
```bash
python -m pytest backend/tests -v
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check & artifact registry diagnostics |
| `GET` | `/api/overview` | Platform summary, fraud prevalence, and selected model KPIs |
| `GET` | `/api/analytics` | Empirical EDA distributions, PCA divergence, and dynamic findings |
| `GET` | `/api/models` | Model registry, hyperparameters, and feature importances |
| `GET` | `/api/alerts` | Paginated top-200 alert queue with filters and review state |
| `GET` | `/api/alerts/{id}` | Transaction deep dive, latent PCA deviations, and notes |
| `GET` | `/api/alerts/export` | CSV download of the ranked top-200 alert queue |
| `PATCH` | `/api/alerts/{id}/review` | Update analyst status (`Pending`, `Under Review`, `Confirmed Fraud`, `Legitimate`) |
| `POST` | `/api/alerts/{id}/note` | Save evidence note and mark `PENDING_APPROVAL` or `APPROVED` |
| `POST` | `/api/predict` | Real-time scoring endpoint for ad-hoc transaction testing |
| `GET` | `/api/evaluation` | Full Precision-Recall & ROC curves with methodology notes |
| `GET` | `/api/capacity` | Dynamic capacity planner and hypothetical cost ROI calculator |

## Deployment (Render / Cloud Container)

A production `Dockerfile` and `render.yaml` are included.
To deploy on Render:
1. Connect your repository to Render.
2. Select **Web Service** with runtime **Docker** or **Python 3**.
3. Build command: `pip install -r backend/requirements.txt`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variable `CORS_ORIGINS` to your Vercel frontend URL.
