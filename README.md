# FraudLens — Full-Stack AI Credit Card Fraud Detection Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.118-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16_App_Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn_1.6-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

FraudLens is an end-to-end, decision-support credit card fraud detection and investigation platform built to solve the operational bottleneck of modern financial crime teams: **screening hundreds of thousands of transactions when fraud is extremely rare (0.173%) and investigators can review only 200 alerts per day.**

Rather than treating automated model scores as proof of guilt or automatically blocking cardholders, FraudLens ranks transactions by machine-learning fraud risk, calculates precision and recall at investigator capacity (**Precision@200** and **Recall@200**), synthesizes evidence-grounded investigation drafts, and provides an analyst console.

---

## 3-Slide Pitch Outline (Hackathon Presentation)

### Slide 1: The Operational Bottleneck
- **The Reality**: Financial institutions process millions of transactions. Fraud is a microscopic needle in a haystack (0.173% prevalence; 1 in ~580 transactions).
- **The Constraint**: Due to labor and regulatory requirements, human fraud investigation units have finite daily capacity (e.g., exactly 200 alerts/day).
- **The Trap**: Standard accuracy is deceptive. An all-negative baseline achieves **99.83% accuracy while catching zero fraud cases**. Random reviews waste analyst hours on false alarms.

### Slide 2: The Solution — FraudLens
- **Leakage-Free ML Engine**: Strict stratified 75/25 train/test split. RobustScaler fitted exclusively on training data.
- **Triage at Capacity**: Instead of arbitrary thresholding, FraudLens ranks the held-out stream by risk score and evaluates performance at analyst quota (**Precision@200** and **Recall@200**).
- **Verified Benchmark**: Random Forest delivers an **81.57% Average Precision (PR-AUC)**, capturing **107 of 123 actual frauds (87.0% recall)** within the top 200 alerts, delivering a **310x fraud density lift** over random auditing.

### Slide 3: Human-in-the-Loop Governance
- **Explainable Investigation**: Latent PCA feature deviation waterfalls (V14, V17, V12, V10) highlighting why a transaction triggered risk.
- **Rule-Based Note Generator**: Generates objective, evidence-grounded case summaries with mandatory `PENDING_APPROVAL` status. Analysts manually edit and approve.
- **Safety Mandate**: Never auto-declines payments without human sign-off. Includes interactive capacity planning and hypothetical cost-benefit ROI modeling.

---

## Actual Model Evaluation Results (Held-Out 25% Test Set)

Evaluated strictly on **71,202 test samples** containing **123 actual fraud cases** (from the Kaggle Credit Card Fraud dataset):

| Model Architecture | Average Precision (PR-AUC) | ROC-AUC | Precision @ 200 Alerts | Recall @ 200 Alerts | Actual Frauds in Top 200 |
|---|---|---|---|---|---|
| **All-Negative Baseline** | 0.17% (0.0017) | 0.5000 | 0.0% (0/200) | 0.0% (0/123) | **0 / 123** |
| **Logistic Regression (Class-Weighted)** | 70.50% (0.7050) | 0.9705 | 52.00% (104/200) | 84.55% (104/123) | **104 / 123** |
| **Random Forest (Balanced Subsample)** | **81.57% (0.8157)** | **0.9657** | **53.50% (107/200)** | **86.99% (107/123)** | **107 / 123** |

### Key Takeaways:
1. **Average Precision over ROC-AUC**: In extreme class imbalance, ROC-AUC remains artificially inflated (~0.97) because the massive true negative pool suppresses the false positive rate. Average Precision measures true precision against recall across all thresholds.
2. **Top-200 Capture Rate**: At a 200 alert/day quota, Random Forest captures **87.0% of all fraud cases in the entire 71,202-transaction test set** with **53.5% precision** (compared to 0.17% baseline prevalence).

---

## Repository Architecture

```
fraudlens/
├── data/
│   └── creditcard.csv                 # Kaggle dataset (284,807 rows, 492 fraud cases) - gitignored
├── ml/
│   └── train.py                       # Leakage-free training & evaluation script (LR, RF)
├── backend/
│   ├── main.py                        # FastAPI application entrypoint with CORS & routes
│   ├── config.py                      # Environment configuration & constants
│   ├── storage.py                     # SQLite persistence for analyst review statuses & notes
│   ├── note_generator.py              # Rule-based note generator (PENDING_APPROVAL workflow)
│   ├── artifacts/                     # Serialized pipelines, models, and precomputed JSONs
│   │   ├── scaler_amount.joblib
│   │   ├── model_logistic_regression.joblib
│   │   ├── model_advanced.joblib
│   │   ├── evaluation_metrics.json
│   │   ├── top200_alerts_advanced.json
│   │   ├── top200_alerts_lr.json
│   │   ├── eda_insights.json
│   │   ├── curves.json
│   │   └── capacity_curves.json
│   ├── routers/
│   │   ├── health.py                  # Health check & system diagnostics
│   │   ├── overview.py                # Dashboard summary & key metrics
│   │   ├── analytics.py               # EDA distributions & dynamic findings
│   │   ├── models.py                  # Model registry & comparisons
│   │   ├── alerts.py                  # Top-200 queue, filters, CSV export, review updates
│   │   ├── predict.py                 # Real-time transaction scoring & explanation
│   │   ├── evaluation.py              # PR/ROC curves, confusion matrices, leakage notes
│   │   └── capacity.py                # Business capacity slider (K=50,100,200,500) & ROI
│   ├── tests/                         # Pytest automated test suite (21 tests passing)
│   ├── requirements.txt               # Backend Python dependencies
│   ├── Dockerfile                     # Container deployment configuration
│   └── render.yaml                    # Infrastructure-as-code for Render
├── frontend/                          # Next.js App Router application
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with dark fintech theme & sidebar
│   │   ├── page.tsx                   # Page A: Overview Dashboard & ROI Calculator
│   │   ├── analytics/page.tsx         # Page B: Transaction Analytics & 3 Dynamic EDA Findings
│   │   ├── alerts/page.tsx            # Page C: Smart Alert Queue (Top-200, filters, CSV export)
│   │   ├── investigation/page.tsx     # Page D: Transaction Deep Dive & Note Approval Workflow
│   │   ├── evaluation/page.tsx        # Page E: Model Evaluation (PR curves, All-Negative baseline)
│   │   ├── reports/page.tsx           # Page F: Reports, Methodology, Model Metadata
│   │   └── roi/page.tsx               # Page G: Business Capacity Planner & ROI Modeler
│   ├── components/                    # Reusable components (Sidebar, MetricCard, StatusBadge)
│   ├── lib/                           # Typed API client and TypeScript interfaces
│   ├── package.json                   # Next.js dependencies
│   └── vercel.json                    # Vercel deployment configuration
├── README.md                          # Full project documentation & instructions
├── requirements.txt                   # Root Python dependencies
├── .env.example                       # Environment variables template
└── .gitignore                         # Excludes dataset, artifacts, node_modules, .env
```

---

## 3 Dynamically Derived EDA Findings

Derived directly from the verified Kaggle Credit Card dataset:
1. **Severe Early Morning Temporal Clustering**: Fraud rate spikes sharply between **02:00 and 05:00 UTC**, peaking at **Hour 2:00 with a fraud rate of 1.71%** — approximately **10x higher** than the baseline rate (0.173%), despite legitimate transaction volumes dipping to daily lows.
2. **Latent PCA Feature Separability (V14, V17, V12, V10)**: Fraudulent transactions exhibit massive structural divergence in PCA dimensions:
   - **V14**: mean `-6.97` (fraud) vs `+0.01` (legitimate)
   - **V17**: mean `-6.67` (fraud) vs `+0.01` (legitimate)
   - **V12**: mean `-6.26` (fraud) vs `+0.01` (legitimate)
   - **V10**: mean `-5.68` (fraud) vs `+0.01` (legitimate)
3. **Prevalence of Low-Value Card-Testing Fraud**: Contrary to the misconception that credit card fraud primarily targets massive amounts, fraudulent transactions exhibit a median of **$9.25** (lower than legitimate transactions at **$22.00**). Fraudulent charges frequently test stolen credentials with low amounts to evade cardholder suspicion before scaling.

---

## Local Setup & Quickstart

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1. Dataset Placement
Download `creditcard.csv` from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) and place it in the `data/` directory:
```
data/creditcard.csv
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run ML pipeline to train models and generate artifacts
python ml/train.py

# Start FastAPI server on port 8000
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The interactive API documentation is accessible at `http://localhost:8000/docs`.

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` to access FraudLens.

---

## Automated Test Execution

The backend includes a comprehensive Pytest suite verifying schema validation, fraud prevalence, leakage prevention, ranking order, note approval lifecycles, and API endpoints:

```bash
python -m pytest backend/tests -v
```

Output:
```
backend/tests/test_api.py::test_health_endpoint PASSED
backend/tests/test_api.py::test_overview_endpoint PASSED
backend/tests/test_api.py::test_analytics_endpoint PASSED
backend/tests/test_api.py::test_models_endpoint PASSED
backend/tests/test_api.py::test_alerts_endpoint PASSED
backend/tests/test_api.py::test_alert_detail_endpoint PASSED
backend/tests/test_api.py::test_csv_export_endpoint PASSED
backend/tests/test_api.py::test_predict_endpoint PASSED
backend/tests/test_api.py::test_capacity_endpoint PASSED
backend/tests/test_dataset.py::test_dataset_exists_and_schema PASSED
backend/tests/test_dataset.py::test_fraud_rate_and_counts PASSED
backend/tests/test_dataset.py::test_no_nulls_and_duplicate_handling PASSED
backend/tests/test_dataset.py::test_missing_dataset_handling PASSED
backend/tests/test_models.py::test_artifacts_exist PASSED
backend/tests/test_models.py::test_leakage_prevention_and_split PASSED
backend/tests/test_models.py::test_all_negative_baseline PASSED
backend/tests/test_models.py::test_top200_ranking_strictly_by_score PASSED
backend/tests/test_models.py::test_precision_recall_at_200_math PASSED
backend/tests/test_notes.py::test_note_generator_defaults_to_pending_approval PASSED
backend/tests/test_notes.py::test_note_persistence_and_approval PASSED
backend/tests/test_notes.py::test_review_status_update PASSED
======================= 21 passed in 5.93s =======================
```

To verify the Next.js production compilation:
```bash
cd frontend
npm run build
```

---

## Cloud Deployment Guide

### Deploy Backend to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect this repository.
3. Configure settings:
   - **Environment**: Python 3 (or Docker)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Set Environment Variables:
   - `PORT`: `10000` (or leave default assigned by Render)
   - `CORS_ORIGINS`: `http://localhost:3000,https://your-frontend.vercel.app`
5. Note your deployed backend URL (e.g., `https://fraudlens-api.onrender.com`).

### Deploy Frontend to Vercel
1. Import this repository on [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://fraudlens-api.onrender.com`
4. Click **Deploy**.

---

## Security & Ethical Safeguards

- **No Secret Leakage**: Dataset and environment secrets are excluded via `.gitignore`.
- **Anonymized Data**: V1 through V28 are orthogonal PCA principal components preserving customer anonymity.
- **Decision-Support Prototype**: Fraud scores are prioritized risk indicators, not definitive proof. The application does not automatically decline charges or freeze accounts.
- **Auditable Note Approval**: Notes initialize with status `PENDING_APPROVAL` and require manual investigator sign-off before becoming `APPROVED`.

---

## Operational Limitations & Troubleshooting

- **Cold Starts**: When deployed on free-tier hosting (e.g. Render Free), the backend may spin down after inactivity. The frontend includes automatic offline detection and retry buttons.
- **PCA Interpretability**: Because features V1–V28 are anonymized mathematical components, they cannot reveal merchant category codes (MCC), geolocation, or cardholder demographics.
- **Concept Drift**: Machine learning models should be retrained periodically to adapt to evolving fraud vectors.
