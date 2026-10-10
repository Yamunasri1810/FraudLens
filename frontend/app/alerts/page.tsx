"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { AlertItem, AlertsResponse } from "@/lib/types";

export default function SmartAlertQueuePage() {
  const [model, setModel] = useState<"random_forest" | "logistic_regression">("random_forest");
  const [capacity, setCapacity] = useState<number>(200);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [priority, setPriority] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [timeWindow, setTimeWindow] = useState<number | undefined>(undefined);

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick review status mutation state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAlerts({
        model,
        capacity,
        page,
        limit,
        priority: priority || undefined,
        review_status: reviewStatus || undefined,
        search: search.trim() || undefined,
        time_window_hours: timeWindow,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load alert queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [model, capacity, page, limit, priority, reviewStatus, timeWindow]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAlerts();
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    setUpdatingId(alertId);
    try {
      await api.updateReviewStatus(alertId, newStatus);
      // update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === alertId ? { ...item, review_status: newStatus as any } : item
          ),
        };
      });
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Smart Alert Queue (Top 200 Prioritized)
            </h1>
            <span className="text-xs bg-rose-950/80 text-rose-300 font-semibold px-2 py-0.5 rounded border border-rose-500/30">
              Ranked by Risk Score
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Held-out test-set evaluation queue. Sorted strictly by model-predicted fraud probability.
          </p>
        </div>

        {/* Action Buttons: CSV Export & Model Toggle */}
        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl(model)}
            download
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </a>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center shadow-inner">
            <button
              onClick={() => {
                setModel("random_forest");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                model === "random_forest"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Random Forest
            </button>
            <button
              onClick={() => {
                setModel("logistic_regression");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                model === "logistic_regression"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Logistic Regression
            </button>
          </div>
        </div>
      </div>

      {/* Held-Out Evaluation Queue Label & Warning */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Evaluation Queue Mode:</strong> Showing ranked test transactions. Quota capacity:{" "}
            <strong className="text-white">{capacity} alerts</strong> | Actual fraud cases captured:{" "}
            <strong className="text-emerald-400">{data?.actual_fraud_count_in_capacity ?? "--"}</strong>{" "}
            (Precision:{" "}
            <strong className="text-emerald-400">
              {data ? (data.queue_precision_at_capacity * 100).toFixed(1) : "--"}%
            </strong>
            )
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Capacity:</span>
          {[50, 100, 200, 500].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCapacity(c);
                setPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                capacity === c
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID (e.g. TXN-054321) or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Priority Filter */}
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Priority"
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Review Status Filter */}
            <select
              value={reviewStatus}
              onChange={(e) => {
                setReviewStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Review Status"
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Review Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Confirmed Fraud">Confirmed Fraud</option>
              <option value="Legitimate">Legitimate</option>
            </select>

            {/* Time Window Simulation Selector */}
            <select
              value={timeWindow ?? ""}
              onChange={(e) => {
                setTimeWindow(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              aria-label="Simulate Time Window"
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Entire 48h Period</option>
              <option value="12">First 12h Window</option>
              <option value="24">First 24h Window</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setPriority("");
                setReviewStatus("");
                setTimeWindow(undefined);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Alert Queue Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Elapsed Time</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Model Risk Score</th>
                <th className="py-3 px-4">Priority Tier</th>
                <th className="py-3 px-4">Analyst Review</th>
                <th className="py-3 px-4 text-center">Offline Ground Truth</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Loading prioritized alerts...</span>
                    </div>
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      #{item.rank}
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      <Link
                        href={`/investigation?id=${item.id}&model=${model}`}
                        className="hover:text-cyan-400 hover:underline flex items-center gap-1.5"
                      >
                        {item.id}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{(item.time / 3600).toFixed(1)}h</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      ${item.amount.toFixed(2)}
                    </td>

                    {/* Risk Score Progress Bar */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.risk_score >= 0.85
                                ? "bg-rose-500"
                                : item.risk_score >= 0.65
                                ? "bg-amber-500"
                                : item.risk_score >= 0.40
                                ? "bg-cyan-500"
                                : "bg-slate-500"
                            }`}
                            style={{ width: `${Math.min(100, item.risk_score * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white text-[11px] w-12 text-right">
                          {(item.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Priority Tier Badge */}
                    <td className="py-3.5 px-4">
                      <StatusBadge type="priority" value={item.priority} />
                    </td>

                    {/* Analyst Review Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={item.review_status}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        aria-label={`Update review status for ${item.id}`}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 bg-slate-950 border focus:outline-none transition-colors ${
                          item.review_status === "Confirmed Fraud"
                            ? "border-red-500/40 text-red-300"
                            : item.review_status === "Legitimate"
                            ? "border-emerald-500/40 text-emerald-300"
                            : item.review_status === "Under Review"
                            ? "border-amber-500/40 text-amber-300"
                            : "border-slate-800 text-slate-400"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Confirmed Fraud">Confirmed Fraud</option>
                        <option value="Legitimate">Legitimate</option>
                      </select>
                    </td>

                    {/* Ground Truth Label (clearly labeled offline only) */}
                    <td className="py-3.5 px-4 text-center">
                      {item.is_fraud_ground_truth === 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                          Actual Fraud (1)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                          Legitimate (0)
                        </span>
                      )}
                    </td>

                    {/* Action link */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/investigation?id=${item.id}&model=${model}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs transition-colors border border-slate-700 inline-block"
                      >
                        Investigate
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60">
            <div>
              Showing Page <strong className="text-white">{data.page}</strong> of{" "}
              <strong className="text-white">{data.total_pages}</strong> ({data.total_items} filtered alerts)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
