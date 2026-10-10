"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Target,
  Percent,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Calculator,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Sparkles,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { OverviewData, CapacityResponse } from "@/lib/types";

export default function OverviewPage() {
  const [model, setModel] = useState<"random_forest" | "logistic_regression">("random_forest");
  const [data, setData] = useState<OverviewData | null>(null);
  const [capacityData, setCapacityData] = useState<CapacityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ROI assumptions state
  const [capacityK, setCapacityK] = useState(200);
  const [lossPerFraud, setLossPerFraud] = useState(2500);
  const [costPerInvestigation, setCostPerInvestigation] = useState(25);

  const fetchOverview = async (selectedModel: "random_forest" | "logistic_regression") => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, capRes] = await Promise.all([
        api.getOverview(selectedModel),
        api.getCapacity(capacityK, lossPerFraud, costPerInvestigation),
      ]);
      setData(overviewRes);
      setCapacityData(capRes);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(model);
  }, [model]);

  const handleUpdateRoi = async () => {
    try {
      const capRes = await api.getCapacity(capacityK, lossPerFraud, costPerInvestigation);
      setCapacityData(capRes);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header with Title and Model Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              FraudLens Command Center
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded border border-slate-700">
              Decision Support
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Prioritizing daily investigation queues for financial fraud analysts with constrained capacity (200 alerts/day).
          </p>
        </div>

        {/* Model Selector Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center shadow-inner">
            <button
              onClick={() => setModel("random_forest")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                model === "random_forest"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Random Forest (Balanced)
            </button>
            <button
              onClick={() => setModel("logistic_regression")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                model === "logistic_regression"
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Logistic Regression (Baseline)
            </button>
          </div>
          <button
            onClick={() => fetchOverview(model)}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reload overview data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="text-sm">
            <div className="font-semibold">Backend Connection Notice</div>
            <div className="text-rose-300/80 mt-0.5">{error}</div>
            <div className="mt-2 text-xs text-rose-400/90 font-mono">
              Ensure FastAPI is running: <code className="bg-rose-950 px-1 py-0.5 rounded">uvicorn backend.main:app --port 8000</code>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Transactions Analyzed"
          value={data ? data.dataset.test_transactions.toLocaleString() : "71,202"}
          subtitle="Held-out 25% evaluation test split"
          icon={Users}
          badge={`${data ? (data.dataset.total_transactions).toLocaleString() : "284,807"} full corpus`}
          badgeColor="blue"
        />
        <MetricCard
          title="Fraud Prevalence"
          value={data ? `${data.dataset.fraud_prevalence_pct.toFixed(3)}%` : "0.173%"}
          subtitle="Severe imbalance (1 in ~580 txns)"
          icon={ShieldAlert}
          badge="Kaggle Benchmark"
          badgeColor="rose"
        />
        <MetricCard
          title="Average Precision (PR-AUC)"
          value={data ? `${(data.selected_model.average_precision * 100).toFixed(1)}%` : "81.6%"}
          subtitle={model === "random_forest" ? "+11.1% over Logistic Regression" : "Baseline weighted model"}
          icon={TrendingUp}
          badge={model === "random_forest" ? "Best Model" : "Linear Baseline"}
          badgeColor="emerald"
        />
        <MetricCard
          title="Precision @ 200 Alerts"
          value={data ? `${(data.selected_model.precision_at_200 * 100).toFixed(1)}%` : "53.5%"}
          subtitle={data ? `${data.selected_model.fraud_in_top_200} actual frauds in top 200` : "107 of 200 alerts confirmed"}
          icon={Target}
          badge="Daily Quota Match"
          badgeColor="emerald"
        />
      </div>

      {/* Operational Highlights Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="space-y-2 md:border-r md:border-slate-800/80 md:pr-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Fraud Coverage (Recall@200)</span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {data ? `${(data.selected_model.recall_at_200 * 100).toFixed(1)}%` : "87.0%"}
            </div>
            <p className="text-xs text-slate-400">
              The top 200 alert queue captures <strong className="text-slate-200">{data?.selected_model.fraud_in_top_200 ?? 107}</strong> of all <strong className="text-slate-200">{data?.dataset.test_actual_frauds ?? 123}</strong> actual fraud cases in the entire 71,202 test set.
            </p>
          </div>

          <div className="space-y-2 md:border-r md:border-slate-800/80 md:pr-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Analyst Quota Efficiency</span>
            </div>
            <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
              310x Multiplier
            </div>
            <p className="text-xs text-slate-400">
              Prioritizing transactions lifts fraud density from <strong className="text-slate-200">0.173%</strong> in raw stream to <strong className="text-slate-200">{data ? (data.selected_model.precision_at_200 * 100).toFixed(1) : "53.5"}%</strong> in the queue.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>All-Negative Accuracy Trap</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-300 tracking-tight">
              99.83% <span className="text-xs text-rose-400 font-normal">→ 0 Frauds</span>
            </div>
            <p className="text-xs text-slate-400">
              An all-negative baseline achieves 99.83% accuracy but detects zero fraud. High accuracy without Precision-Recall triage is dangerous in banking.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Capacity & Cost-Impact Calculator + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Cost-Impact ROI Calculator */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Operational Capacity & Cost-Impact Calculator
                </h2>
                <p className="text-xs text-slate-400">
                  Hypothetical financial simulation based on investigator capacity K and cost assumptions.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-amber-400/90 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
              Hypothetical Model
            </span>
          </div>

          {/* Interactive Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Investigation Capacity (K)
              </label>
              <div className="flex items-center gap-1">
                {[50, 100, 200, 500].map((kVal) => (
                  <button
                    key={kVal}
                    onClick={() => {
                      setCapacityK(kVal);
                      setTimeout(handleUpdateRoi, 50);
                    }}
                    className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                      capacityK === kVal
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {kVal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Loss Per Missed Fraud ($)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">$</span>
                <input
                  type="number"
                  value={lossPerFraud}
                  onChange={(e) => setLossPerFraud(Number(e.target.value))}
                  onBlur={handleUpdateRoi}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 pl-6 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Cost Per Review ($)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">$</span>
                <input
                  type="number"
                  value={costPerInvestigation}
                  onChange={(e) => setCostPerInvestigation(Number(e.target.value))}
                  onBlur={handleUpdateRoi}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 pl-6 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Calculator Output KPI Cards */}
          {capacityData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Frauds Caught</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {capacityData.financial_impact.random_forest.frauds_prevented} / 123
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {(capacityData.metrics_at_k.rf_recall * 100).toFixed(1)}% test recall
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Gross Loss Prevented</div>
                <div className="text-xl font-bold text-white mt-1">
                  ${(capacityData.financial_impact.random_forest.fraud_loss_prevented).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  @ ${lossPerFraud.toLocaleString()}/fraud
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Review Expense</div>
                <div className="text-xl font-bold text-slate-300 mt-1">
                  ${(capacityData.financial_impact.random_forest.investigation_expense).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {capacityK} reviews @ ${costPerInvestigation}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-[11px] font-semibold text-emerald-300 uppercase">Net Financial Value</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  ${(capacityData.financial_impact.random_forest.net_financial_benefit).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5 font-semibold">
                  {capacityData.financial_impact.random_forest.roi_multiple}x ROI ratio
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span className="italic text-[11px]">
              * Note: Calculations are illustrative decision-support projections.
            </span>
            <Link
              href="/roi"
              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
            >
              Full Capacity Curve <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Col: Analyst Review Queue Summary & Activity */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Analyst Review Queue</span>
              </h2>
              <Link
                href="/alerts"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View Top 200
              </Link>
            </div>

            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Pending Review</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {data?.investigation_summary.pending_count ?? 200}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Under Review</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {data?.investigation_summary.under_review_count ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Confirmed Fraud</div>
                <div className="text-lg font-bold text-rose-400 mt-0.5">
                  {data?.investigation_summary.confirmed_fraud_count ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Cleared Legitimate</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {data?.investigation_summary.legitimate_cleared_count ?? 0}
                </div>
              </div>
            </div>

            {/* Recent Activity List */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recent Analyst Decisions
              </div>
              {data && data.recent_analyst_activity && data.recent_analyst_activity.length > 0 ? (
                <div className="space-y-2">
                  {data.recent_analyst_activity.slice(0, 4).map((item) => (
                    <div
                      key={item.alert_id}
                      className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-300 font-semibold">{item.alert_id}</span>
                      <StatusBadge type="review" value={item.review_status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/60 text-center text-xs text-slate-400">
                  No manual review overrides recorded yet. Analysts review cases in the Smart Alert Queue.
                </div>
              )}
            </div>
          </div>

          <Link
            href="/alerts"
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            Launch Smart Alert Queue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
