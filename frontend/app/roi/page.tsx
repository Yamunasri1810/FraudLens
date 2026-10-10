"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { api } from "@/lib/api";
import { CapacityResponse } from "@/lib/types";

export default function CapacityRoiPage() {
  const [capacityK, setCapacityK] = useState<number>(200);
  const [lossPerFraud, setLossPerFraud] = useState<number>(2500);
  const [costPerInvestigation, setCostPerInvestigation] = useState<number>(25);

  const [data, setData] = useState<CapacityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCapacity(capacityK, lossPerFraud, costPerInvestigation);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load capacity analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacity();
  }, [capacityK]);

  const handleUpdate = () => {
    fetchCapacity();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Capacity Planning & Cost-Impact ROI Modeler
            </h1>
            <span className="text-xs bg-emerald-950/80 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Executive Simulator
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Evaluate operational trade-offs, staffing limits, and cost-benefit dynamics across varying alert volumes.
          </p>
        </div>

        <button
          onClick={fetchCapacity}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reload simulation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hypothetical Notice Banner */}
      <div className="bg-slate-900/80 rounded-xl border border-amber-500/30 p-4 text-xs flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-0.5">Hypothetical Simulation Methodology</span>
          <p className="text-slate-300 leading-relaxed">
            All cost projections are illustrative simulations based on user-supplied assumptions. 
            Financial figures demonstrate mathematical returns over random unprioritized reviews on the held-out test set, not audited financial guarantees.
          </p>
        </div>
      </div>

      {/* Assumptions Input Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>Simulation Parameters</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          {/* Capacity K */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Daily Investigation Capacity (K alerts)
            </label>
            <div className="flex items-center gap-2">
              {[50, 100, 200, 500].map((k) => (
                <button
                  key={k}
                  onClick={() => setCapacityK(k)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    capacityK === k
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Loss Per Fraud */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Estimated Loss Per Missed Fraud ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">$</span>
              <input
                type="number"
                value={lossPerFraud}
                onChange={(e) => setLossPerFraud(Number(e.target.value))}
                onBlur={handleUpdate}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Cost Per Investigation */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Estimated Cost Per Manual Review ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">$</span>
              <input
                type="number"
                value={costPerInvestigation}
                onChange={(e) => setCostPerInvestigation(Number(e.target.value))}
                onBlur={handleUpdate}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards for Selected K */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={`Precision @ ${capacityK} Alerts`}
            value={`${(data.metrics_at_k.rf_precision * 100).toFixed(1)}%`}
            subtitle={`${data.financial_impact.random_forest.frauds_prevented} verified frauds caught`}
            icon={Target}
            badge="Random Forest"
            badgeColor="emerald"
          />
          <MetricCard
            title={`Recall @ ${capacityK} Alerts`}
            value={`${(data.metrics_at_k.rf_recall * 100).toFixed(1)}%`}
            subtitle={`${data.financial_impact.random_forest.frauds_prevented} of ${data.total_evaluation_frauds} test frauds`}
            icon={TrendingUp}
            badge="Coverage"
            badgeColor="emerald"
          />
          <MetricCard
            title="Gross Loss Prevented"
            value={`$${data.financial_impact.random_forest.fraud_loss_prevented.toLocaleString()}`}
            subtitle={`Review expense: $${data.financial_impact.random_forest.investigation_expense.toLocaleString()}`}
            icon={DollarSign}
            badge="Hypothetical"
            badgeColor="blue"
          />
          <MetricCard
            title="Net Benefit (ROI Multiple)"
            value={`${data.financial_impact.random_forest.roi_multiple}x`}
            subtitle={`+$${data.financial_impact.random_forest.net_financial_benefit.toLocaleString()} net`}
            icon={ShieldAlert}
            badge="Value Created"
            badgeColor="emerald"
          />
        </div>
      )}

      {/* Comparative ROI Table: Random Forest vs Logistic Regression vs Unprioritized Random */}
      {data && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Strategy Financial Comparison at K = {capacityK} Daily Reviews</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Machine learning prioritization compared to manual linear baseline and unprioritized random auditing.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Triage Strategy</th>
                  <th className="py-3 px-4 text-emerald-400">Frauds Prevented</th>
                  <th className="py-3 px-4 text-rose-400">Frauds Missed</th>
                  <th className="py-3 px-4">Review Expense</th>
                  <th className="py-3 px-4">Loss Prevented</th>
                  <th className="py-3 px-4 text-emerald-400">Net Financial Value</th>
                  <th className="py-3 px-4 text-right">ROI Multiple</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {/* Random Forest */}
                <tr className="bg-emerald-950/20 font-semibold border-l-2 border-emerald-500">
                  <td className="py-3.5 px-4 text-emerald-300">
                    Random Forest (Balanced ML)
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {data.financial_impact.random_forest.frauds_prevented} / {data.total_evaluation_frauds}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {data.financial_impact.random_forest.frauds_missed}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    ${data.financial_impact.random_forest.investigation_expense.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white">
                    ${data.financial_impact.random_forest.fraud_loss_prevented.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    ${data.financial_impact.random_forest.net_financial_benefit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-300">
                    {data.financial_impact.random_forest.roi_multiple}x
                  </td>
                </tr>

                {/* Logistic Regression */}
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-slate-200">
                    Logistic Regression (Class-Weighted)
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                    {data.financial_impact.logistic_regression.frauds_prevented} / {data.total_evaluation_frauds}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {data.financial_impact.logistic_regression.frauds_missed}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    ${data.financial_impact.logistic_regression.investigation_expense.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white">
                    ${data.financial_impact.logistic_regression.fraud_loss_prevented.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                    ${data.financial_impact.logistic_regression.net_financial_benefit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300">
                    {data.financial_impact.logistic_regression.roi_multiple}x
                  </td>
                </tr>

                {/* Unprioritized Random */}
                <tr className="hover:bg-slate-800/40 transition-colors text-slate-500">
                  <td className="py-3.5 px-4">
                    Unprioritized Random Sampling (No Model)
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-400">
                    {data.financial_impact.unprioritized_random_sampling.frauds_prevented} / {data.total_evaluation_frauds}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-400">
                    {data.financial_impact.unprioritized_random_sampling.frauds_missed}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    ${data.financial_impact.unprioritized_random_sampling.investigation_expense.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    ${data.financial_impact.unprioritized_random_sampling.fraud_loss_prevented.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                    ${data.financial_impact.unprioritized_random_sampling.net_financial_benefit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                    Negative ROI
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dynamic Capacity Curve Chart (K = 25 to 1000) */}
      {data && data.all_capacity_points && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Precision@K and Recall@K Capacity Trade-Off Frontier</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Shows how analyst quota expansion from 25 to 1,000 alerts increases fraud recall while precision tapers off.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.all_capacity_points}
                margin={{ top: 15, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="k"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Investigation Capacity K (Alerts Reviewed)", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 10 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  unit="%"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`]}
                  labelFormatter={(k) => `Capacity: ${k} alerts`}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="rf_recall"
                  name="Random Forest Recall@K"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="rf_precision"
                  name="Random Forest Precision@K"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="lr_recall"
                  name="Logistic Regression Recall@K"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
