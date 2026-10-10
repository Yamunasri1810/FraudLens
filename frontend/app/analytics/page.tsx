"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  Info,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { api } from "@/lib/api";
import { AnalyticsData } from "@/lib/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading dataset analytics and dynamic insights...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
          <AlertTriangle className="w-6 h-6 mb-2 text-rose-400" />
          <h2 className="text-lg font-bold">Analytics Data Unavailable</h2>
          <p className="text-sm mt-1">{error || "Could not retrieve exploratory analysis."}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Format PCA features for bar chart
  const pcaChartData = Object.entries(data.pca_features).map(([key, stats]) => ({
    feature: key,
    fraudMean: stats.fraud_mean,
    legitMean: stats.legit_mean,
    divergence: stats.divergence,
    correlation: stats.correlation,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Transaction Analytics & Exploratory Data Analysis
            </h1>
            <span className="text-xs bg-cyan-950/70 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-500/30">
              Verified Kaggle Corpus
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Empirical distributions, PCA latent structures, temporal fraud cycles, and dynamically computed dataset findings.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors self-start md:self-auto"
          title="Refresh dataset analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* PCA Privacy Anonymization Disclaimer Banner */}
      <div className="bg-slate-900/80 rounded-xl border border-cyan-500/20 p-4 text-xs flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-300 block mb-0.5">Privacy Architecture Notice</span>
          <p className="text-slate-300 leading-relaxed">{data.pca_disclaimer}</p>
        </div>
      </div>

      {/* Dataset Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Legitimate Transactions"
          value={data.dataset_summary.legit_count.toLocaleString()}
          subtitle="99.827% class dominance"
          icon={ShieldAlert}
          badge="Class 0"
          badgeColor="emerald"
        />
        <MetricCard
          title="Fraudulent Transactions"
          value={data.dataset_summary.fraud_count.toLocaleString()}
          subtitle="0.173% minority class"
          icon={AlertTriangle}
          badge="Class 1"
          badgeColor="rose"
        />
        <MetricCard
          title="Fraud Median Amount"
          value={`$${data.amount_comparison.fraud.median.toFixed(2)}`}
          subtitle={`Legit median: $${data.amount_comparison.legitimate.median.toFixed(2)}`}
          icon={DollarSign}
          badge="Card Testing"
          badgeColor="amber"
        />
        <MetricCard
          title="Duplicate Records Identified"
          value={data.dataset_summary.duplicate_count.toLocaleString()}
          subtitle="Zero missing null fields"
          icon={Activity}
          badge="Clean Schema"
          badgeColor="blue"
        />
      </div>

      {/* 3 Dynamically Calculated EDA Insights Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Key Empirical Findings Derived From Dataset
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.key_insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-5 rounded-2xl border bg-slate-900/90 shadow-lg flex flex-col justify-between ${
                insight.severity === "critical"
                  ? "border-rose-500/30 hover:border-rose-500/50"
                  : insight.severity === "high"
                  ? "border-amber-500/30 hover:border-amber-500/50"
                  : "border-cyan-500/30 hover:border-cyan-500/50"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      insight.severity === "critical"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                        : insight.severity === "high"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                        : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {insight.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {insight.severity.toUpperCase()} IMPACT
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white pt-1">{insight.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: PCA Feature Divergence & Hourly Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PCA Divergence Chart */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-400" />
                <span>Latent PCA Feature Separability (V14, V17, V12, V10)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mean feature value for Fraud vs Legitimate. Extreme negative shift indicates fraud.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pcaChartData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="feature" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="fraudMean" name="Fraud Mean" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="legitMean" name="Legitimate Mean" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
            {pcaChartData.map((item) => (
              <div key={item.feature} className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="font-mono font-bold text-white">{item.feature}</div>
                <div className="text-[11px] text-rose-400 font-semibold">{item.fraudMean}</div>
                <div className="text-[10px] text-slate-500">r = {item.correlation}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 24-Hour Cycle Fraud Pattern Chart */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>24-Hour Diurnal Fraud Frequency Rate</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated as Fraud Transactions / Total Transactions per UTC hour cycle.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/70 border border-rose-500/30 px-2 py-0.5 rounded">
              Peak: 02:00 UTC (1.71%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.hourly_data}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="hour"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val}%`, "Fraud Rate"]}
                  labelFormatter={(h) => `Hour ${h}:00 UTC`}
                />
                <Line
                  type="monotone"
                  dataKey="fraud_rate_pct"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#06b6d4" }}
                  activeDot={{ r: 6, fill: "#f43f5e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Insight:</strong> Between 02:00 and 05:00 UTC, the fraud rate is ~10x higher than the baseline rate (0.173%), indicating automated bot raids or off-peak exploitation while cardholders sleep.
          </div>
        </div>
      </div>

      {/* Amount Distribution Comparison Table & Stats */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Transaction Amount Empirical Statistics</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between legitimate transactions and confirmed fraud cases.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Amount Metrics Breakdown
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Metric</th>
                    <th className="p-3 text-rose-400">Fraudulent (Class 1)</th>
                    <th className="p-3 text-emerald-400">Legitimate (Class 0)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Median Amount</td>
                    <td className="p-3 font-mono font-bold text-white">${data.amount_comparison.fraud.median.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-slate-300">${data.amount_comparison.legitimate.median.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Mean Amount</td>
                    <td className="p-3 font-mono font-bold text-white">${data.amount_comparison.fraud.mean.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-slate-300">${data.amount_comparison.legitimate.mean.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Maximum Single Charge</td>
                    <td className="p-3 font-mono font-bold text-rose-300">${data.amount_comparison.fraud.max.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-emerald-300">${data.amount_comparison.legitimate.max.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Amount Tier Frequency (USD)
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.amount_distribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bucket" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="fraud" name="Fraud Count" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
