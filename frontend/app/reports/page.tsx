"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Shield,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [health, setHealth] = useState<any>(null);
  const [modelsData, setModelsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, m] = await Promise.all([api.getHealth(), api.getModels()]);
      setHealth(h);
      setModelsData(m);
    } catch (err: any) {
      setError(err.message || "Failed to load reports metadata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Reports, Audit Trails & Model Governance
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded border border-slate-700">
              System Info v1.0.0
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Data governance reports, model artifact schemas, operational limitations, and downloadable audit exports.
          </p>
        </div>

        <button
          onClick={fetchReportsData}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh report information"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Backend Diagnostics & Health Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Backend Diagnostic State</span>
          </h2>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              health?.status === "healthy"
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                : "bg-rose-950/80 text-rose-300 border-rose-500/30"
            }`}
          >
            {health?.status ? health.status.toUpperCase() : "OFFLINE"}
          </span>
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Backend Service Unreachable</span>
            </div>
            <p>{error}</p>
            <p className="font-mono text-slate-400 text-[11px]">
              Expected host: {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">API Service</span>
              <span className="font-bold text-white text-sm">{health?.service || "FraudLens API"}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">FastAPI + Uvicorn</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Artifact Registry</span>
              <span className="font-bold text-emerald-400 text-sm">
                {health?.artifacts_loaded ? "All Artifacts Verified" : "Degraded"}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Serialized in backend/artifacts/</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Analyst Persistence</span>
              <span className="font-bold text-cyan-400 text-sm">SQLite Engine</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">backend/data/reviews.db</span>
            </div>
          </div>
        )}
      </div>

      {/* Audit Export Downloads */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Downloadable Governance & Audit Artifacts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-white block">Top-200 Alert Queue (Random Forest)</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Contains ranks, transaction IDs, risk scores, priority tiers, and analyst review states.
              </p>
            </div>
            <a
              href={api.getExportCsvUrl("random_forest")}
              download
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </a>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-white block">Top-200 Alert Queue (Logistic Regression)</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Baseline linear model rankings for comparative audit and compliance cross-checks.
              </p>
            </div>
            <a
              href={api.getExportCsvUrl("logistic_regression")}
              download
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* Dataset Validation & Training Configuration */}
      {modelsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dataset Validation */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Dataset Integrity Verification</span>
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Dataset Instances</span>
                <span className="font-mono text-white font-bold">284,807 transactions</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Stratified Split Protocol</span>
                <span className="font-mono text-cyan-400 font-bold">75.0% Train / 25.0% Test</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Training Samples (Unseen Test Separated)</span>
                <span className="font-mono text-white">213,605 (369 Frauds)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Held-Out Test Set</span>
                <span className="font-mono text-white">71,202 (123 Frauds)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Missing / Null Values</span>
                <span className="font-mono text-emerald-400 font-bold">0 (Clean Schema)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Identified Duplicate Records</span>
                <span className="font-mono text-amber-400">1,081 duplicates (1,854 rows)</span>
              </div>
            </div>
          </div>

          {/* Model Training Hyperparameters */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Model Hyperparameter Registry</span>
            </h2>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-emerald-300">RandomForestClassifier (Primary)</div>
                <div className="text-slate-400 text-[11px] mt-1 font-mono">
                  n_estimators: 100 | max_depth: 15 | class_weight: &quot;balanced_subsample&quot; | random_state: 42
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-cyan-300">LogisticRegression (Baseline)</div>
                <div className="text-slate-400 text-[11px] mt-1 font-mono">
                  max_iter: 1000 | class_weight: &quot;balanced&quot; | solver: &quot;lbfgs&quot; | random_state: 42
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-amber-300">Scaling Preprocessor</div>
                <div className="text-slate-400 text-[11px] mt-1 font-mono">
                  RobustScaler fitted exclusively on training split Amount values
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Operational Limitations & Ethics */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Operational Boundaries & Production Deployment Limitations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200 block">1. PCA Feature Anonymization</span>
            <p>
              Features V1 through V28 are orthogonal PCA principal components. While effective for statistical pattern recognition, 
              they cannot directly attribute physical locations, specific merchant category codes (MCC), or device hardware fingerprints.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200 block">2. Concept Drift & Seasonality</span>
            <p>
              Credit card fraud vectors evolve dynamically (e.g. holiday surges, emerging digital wallet bypasses). 
              A model trained on static historical distributions must be retrained continuously with incoming fraud labels to maintain calibration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200 block">3. Decision-Support Mandate</span>
            <p>
              Automated blocking of genuine transactions leads to high customer friction and false decline churn. FraudLens is architected as an 
              investigator prioritization engine; all critical alerts require human analyst confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
