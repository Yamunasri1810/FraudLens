# FraudLens Frontend — Next.js Decision Support Dashboard

The FraudLens frontend is a high-performance Next.js web application engineered for financial fraud investigation teams. Built with the App Router, TypeScript, Tailwind CSS, Lucide icons, and Recharts, it features a responsive dark fintech interface.

## Pages Overview

- **Overview Dashboard (`/`)**: High-impact operational KPIs, model comparison toggle, investigation capacity selector, and hypothetical cost-impact ROI calculator.
- **Transaction Analytics (`/analytics`)**: Class distributions, empirical amount comparisons, latent PCA component divergence (V14, V17, V12, V10), 24-hour diurnal fraud rate cycles, and 3 dynamically computed EDA findings.
- **Smart Alert Queue (`/alerts`)**: Prioritized daily review queue sorted strictly by model risk score. Includes search, multi-tier filters, time-window simulations, and CSV export.
- **Transaction Investigation (`/investigation`)**: Granular transaction inspection with feature deviation waterfalls, rule-based note generator (`PENDING_APPROVAL` workflow), manual editing, and ad-hoc live transaction predictor.
- **Model Evaluation (`/evaluation`)**: Interactive Precision-Recall and ROC curves, confusion matrices, and detailed explanations of why Average Precision is the mathematically sound metric for extreme imbalance.
- **Reports & Governance (`/reports`)**: CSV download links, dataset integrity reports, model hyperparameter configurations, operational limitations, and live backend diagnostic probes.
- **Capacity & ROI Modeler (`/roi`)**: Interactive executive planner demonstrating mathematical returns across varying alert capacities (K = 50, 100, 200, 500).

## Local Development

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
```

## Vercel Deployment

1. Import the repository into your Vercel dashboard.
2. Set the **Root Directory** to `frontend`.
3. Add the environment variable:
   - `NEXT_PUBLIC_API_BASE_URL`: The deployed URL of your FraudLens FastAPI backend (e.g., `https://fraudlens-backend.onrender.com`).
4. Click **Deploy**.
