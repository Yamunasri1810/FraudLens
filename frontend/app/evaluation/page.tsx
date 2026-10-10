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
  ReferenceLine,
} from "recharts";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Info,
  CheckCircle2,
  RefreshCw,
  Target,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { EvaluationData } from "@/lib/types";

export default function ModelEvaluationPage() {
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvaluation();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load model evaluation metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading evaluation curves and protocol metadata...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
          <AlertTriangle className="w-6 h-6 mb-2 text-rose-400" />
          <h2 className="text-lg font-bold">Evaluation Data Unavailable</h2>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Combine PR curves for Recharts
  const rfPr = data.curves.precision_recall.random_forest;
  const lrPr = data.curves.precision_recall.logistic_regression;
  const maxLen = Math.max(rfPr.length, lrPr.length);
  const prChartData = [];
  for (let i = 0; i < maxLen; i++) {
    const rfPoint = rfPr[i] || rfPr[rfPr.length - 1];
    const lrPoint = lrPr[i] || lrPr[lrPr.length - 1];
    prChartData.push({
      recall: rfPoint ? rfPoint.recall : 0,
      rfPrecision: rfPoint ? rfPoint.precision : 0,
      lrPrecision: lrPoint ? lrPoint.precision : 0,
      baselinePrevalence: data.curves.precision_recall.baseline_prevalence,
    });
  }

  // Combine ROC curves
  const rfRoc = data.curves.roc.random_forest;
  const lrRoc = data.curves.roc.logistic_regression;
  const maxRocLen = Math.max(rfRoc.length, lrRoc.length);
  const rocChartData = [];
  for (let i = 0; i < maxRocLen; i++) {
    const rfP = rfRoc[i] || rfRoc[rfRoc.length - 1];
    const lrP = lrRoc[i] || lrRoc[lrRoc.length - 1];
    rocChartData.push({
      fpr: rfP ? rfP.fpr : 0,
      rfTpr: rfP ? rfP.tpr : 0,
      lrTpr: lrP ? lrP.tpr : 0,
      randomBaseline: rfP ? rfP.fpr : 0,
    });
  }

  const rfModel = data.models.random_forest;
  const lrModel = data.models.logistic_regression;
  const allNegModel = data.models.all_negative;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Model Evaluation & Rigorous Benchmarking
            </h1>
            <span className="text-xs bg-emerald-950/80 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Leakage-Free Protocol
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Comparative evaluation between All-Negative Baseline, Balanced Logistic Regression, and Ensemble Random Forest.
          </p>
        </div>

        <button
          onClick={fetchEvaluation}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reload evaluation metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Head-to-Head Performance Benchmark (Held-Out Test Set)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated on 71,202 unseen transactions containing 123 verified fraud instances.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Classifier Model</th>
                <th className="py-3 px-4">Model Class</th>
                <th className="py-3 px-4 text-emerald-400">Average Precision (AP)</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4 text-cyan-400">Precision @ 200</th>
                <th className="py-3 px-4 text-cyan-400">Recall @ 200</th>
                <th className="py-3 px-4 text-center">Actual Frauds in Top 200</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {/* All-Negative Baseline */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-300">
                  {allNegModel.name}
                </td>
                <td className="py-3.5 px-4 text-slate-400">{allNegModel.type}</td>
                <td className="py-3.5 px-4 font-mono text-slate-500">
                  {(allNegModel.average_precision * 100).toFixed(3)}%
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500">0.5000</td>
                <td className="py-3.5 px-4 font-mono text-rose-400 font-bold">0.0%</td>
                <td className="py-3.5 px-4 font-mono text-rose-400 font-bold">0.0%</td>
                <td className="py-3.5 px-4 text-center font-mono text-rose-400 font-bold">
                  0 / 123
                </td>
              </tr>

              {/* Logistic Regression */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-white">
                  {lrModel.name}
                </td>
                <td className="py-3.5 px-4 text-slate-400">{lrModel.type}</td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">
                  {(lrModel.average_precision * 100).toFixed(2)}%
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">
                  {lrModel.roc_auc.toFixed(4)}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">
                  {(lrModel.precision_at_200 * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">
                  {(lrModel.recall_at_200 * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-white font-bold">
                  {lrModel.fraud_in_top_200} / 123
                </td>
              </tr>

              {/* Random Forest (Champion) */}
              <tr className="bg-emerald-950/20 border-l-2 border-emerald-500 hover:bg-emerald-950/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{rfModel.name}</span>
                </td>
                <td className="py-3.5 px-4 text-emerald-400/90 font-medium">{rfModel.type}</td>
                <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400 text-sm">
                  {(rfModel.average_precision * 100).toFixed(2)}%
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                  {rfModel.roc_auc.toFixed(4)}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                  {(rfModel.precision_at_200 * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                  {(rfModel.recall_at_200 * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-emerald-300 font-extrabold text-sm">
                  {rfModel.fraud_in_top_200} / 123
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Visualizers: Precision-Recall Curve & ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Precision-Recall Curve */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Precision-Recall Curve (Primary Metric)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct trade-off under extreme 0.173% imbalance. RF AP = {(rfModel.average_precision * 100).toFixed(1)}%.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="recall"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Recall", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 10 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  domain={[0, 1]}
                  label={{ value: "Precision", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="rfPrecision"
                  name="Random Forest (AP = 81.6%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lrPrecision"
                  name="Logistic Regression (AP = 70.5%)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <ReferenceLine
                  y={0.0017}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{ value: "Baseline Prevalence (0.17%)", fill: "#f43f5e", fontSize: 10, position: "insideTopRight" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curve */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>ROC Curve (Secondary Metric)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                True Positive Rate vs False Positive Rate. Random baseline diagonal in red.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="fpr"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: "False Positive Rate (FPR)", position: "insideBottomRight", offset: -5, fill: "#64748b", fontSize: 10 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  domain={[0, 1]}
                  label={{ value: "True Positive Rate (TPR)", position: "insideLeft", angle: -90, fill: "#64748b", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="rfTpr"
                  name="Random Forest (AUC = 0.966)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lrTpr"
                  name="Logistic Regression (AUC = 0.971)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="randomBaseline"
                  name="Random Guess (0.50)"
                  stroke="#f43f5e"
                  strokeDasharray="2 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Confusion Matrix Comparison (Standard Threshold 0.50 on 71,202 Test Samples)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* RF Matrix */}
          {rfModel.confusion_matrix && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-400">
                Random Forest Classifier (Balanced Subsample)
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">True Negatives</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {rfModel.confusion_matrix[0][0].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Legit Cleared</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">False Positives</span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {rfModel.confusion_matrix[0][1].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">False Alarms</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">False Negatives</span>
                  <span className="text-lg font-mono font-bold text-rose-400">
                    {rfModel.confusion_matrix[1][0].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Missed Frauds</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">True Positives</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {rfModel.confusion_matrix[1][1].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Frauds Caught</span>
                </div>
              </div>
            </div>
          )}

          {/* LR Matrix */}
          {lrModel.confusion_matrix && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-cyan-400">
                Logistic Regression (Class-Weighted)
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30">
                  <span className="text-[10px] text-slate-400 block">True Negatives</span>
                  <span className="text-lg font-mono font-bold text-cyan-400">
                    {lrModel.confusion_matrix[0][0].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Legit Cleared</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">False Positives</span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {lrModel.confusion_matrix[0][1].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">False Alarms</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">False Negatives</span>
                  <span className="text-lg font-mono font-bold text-rose-400">
                    {lrModel.confusion_matrix[1][0].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Missed Frauds</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30">
                  <span className="text-[10px] text-slate-400 block">True Positives</span>
                  <span className="text-lg font-mono font-bold text-cyan-400">
                    {lrModel.confusion_matrix[1][1].toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Frauds Caught</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Methodology & Leakage Prevention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Class Imbalance Triage</span>
          </div>
          <h3 className="text-sm font-bold text-white">{data.methodology.class_imbalance.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {data.methodology.class_imbalance.explanation}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Leakage Prevention</span>
          </div>
          <h3 className="text-sm font-bold text-white">{data.methodology.leakage_prevention.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
            {data.methodology.leakage_prevention.explanation}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Metric Formulation</span>
          </div>
          <h3 className="text-sm font-bold text-white">{data.methodology.average_precision_vs_trapezoid.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {data.methodology.average_precision_vs_trapezoid.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
