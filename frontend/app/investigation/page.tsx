"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Info,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  UserCheck,
  RefreshCw,
  Search,
  Sliders,
  ChevronRight,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { AlertDetailResponse, AlertItem } from "@/lib/types";

function InvestigationContent() {
  const searchParams = useSearchParams();
  const alertIdParam = searchParams.get("id");
  const modelParam = searchParams.get("model") || "random_forest";

  const [activeAlertId, setActiveAlertId] = useState<string>(alertIdParam || "TXN-054321");
  const [model, setModel] = useState<string>(modelParam);
  const [detail, setDetail] = useState<AlertDetailResponse | null>(null);
  const [topAlertsList, setTopAlertsList] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Editable note state
  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState<"PENDING_APPROVAL" | "APPROVED">("PENDING_APPROVAL");
  const [analystName, setAnalystName] = useState("Analyst_J_Miller");
  const [reviewStatus, setReviewStatus] = useState("Pending");

  // Custom Simulator State (Interactive Predictor)
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAmount, setSimAmount] = useState<number>(14.50);
  const [simTime, setSimTime] = useState<number>(7200);
  const [simV14, setSimV14] = useState<number>(-7.2);
  const [simV17, setSimV17] = useState<number>(-6.5);
  const [simV12, setSimV12] = useState<number>(-6.1);
  const [simV10, setSimV10] = useState<number>(-5.3);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Load alert list for easy switcher dropdown
  useEffect(() => {
    api.getAlerts({ model, limit: 50 }).then((res) => {
      setTopAlertsList(res.items);
      if (!alertIdParam && res.items.length > 0) {
        setActiveAlertId(res.items[0].id);
      }
    }).catch(console.error);
  }, [model]);

  // Load selected alert details
  useEffect(() => {
    if (!activeAlertId) return;
    setLoading(true);
    setSaveSuccessMessage(null);
    api.getAlertDetail(activeAlertId, model)
      .then((res) => {
        setDetail(res);
        setNoteText(res.investigation_note.text);
        setNoteStatus(res.investigation_note.status);
        setReviewStatus(res.review_status);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [activeAlertId, model]);

  const handleSaveNote = async (approve = false) => {
    setSavingNote(true);
    setSaveSuccessMessage(null);
    try {
      const nextStatus = approve ? "APPROVED" : "PENDING_APPROVAL";
      await api.updateNote(activeAlertId, noteText, nextStatus, approve ? analystName : undefined);
      setNoteStatus(nextStatus);
      setSaveSuccessMessage(approve ? "Note approved and saved to audit log!" : "Draft note saved.");
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Error saving note: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleReviewStatusUpdate = async (newStatus: string) => {
    try {
      await api.updateReviewStatus(activeAlertId, newStatus);
      setReviewStatus(newStatus);
      setSaveSuccessMessage(`Status updated to '${newStatus}'`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Error updating review: ${err.message}`);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const vFeatures: Record<string, number> = {
        V14: simV14,
        V17: simV17,
        V12: simV12,
        V10: simV10,
      };
      // fill remaining V components with small numbers
      for (let i = 1; i <= 28; i++) {
        const k = `V${i}`;
        if (!vFeatures[k]) vFeatures[k] = 0.05;
      }
      const res = await api.predictTransaction({
        time: simTime,
        amount: simAmount,
        v_features: vFeatures,
        model,
      });
      setSimResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Transaction Deep Dive & Investigation Console
            </h1>
            <span className="text-xs bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded border border-slate-700">
              Analyst Workflow
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Examine model risk breakdown, latent PCA deviations, and verify human-in-the-loop investigation notes.
          </p>
        </div>

        {/* Quick Transaction Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900 text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimulator ? "Hide Simulator" : "Live Predictor"}</span>
          </button>

          <select
            value={activeAlertId}
            onChange={(e) => setActiveAlertId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-xs font-mono font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            {topAlertsList.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.rank} — {a.id} (${a.amount.toFixed(2)}) — {(a.risk_score * 100).toFixed(1)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Decision-Support Safety Notice Banner */}
      <div className="bg-amber-950/40 rounded-xl border border-amber-500/30 p-4 text-xs flex items-start gap-3 shadow-lg">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-0.5">Decision-Support Guardrail</span>
          <p className="text-amber-200/90 leading-relaxed">
            FraudLens is a human-in-the-loop decision-support prototype. Risk scores and generated notes do not constitute proof of fraud. 
            Do not automatically decline transactions, freeze accounts, or contact cardholders without manual analyst review and confirmation.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Optional Interactive Custom Predictor Drawer */}
      {showSimulator && (
        <div className="bg-slate-900/95 rounded-2xl border border-indigo-500/30 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Real-Time Ad-Hoc Transaction Scoring</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Supply transaction amount and latent PCA components to score live against the trained pipeline.
              </p>
            </div>
          </div>

          <form onSubmit={handleRunSimulation} className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Elapsed Time (s)</label>
              <input
                type="number"
                value={simTime}
                onChange={(e) => setSimTime(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">V14 (Latent)</label>
              <input
                type="number"
                step="0.1"
                value={simV14}
                onChange={(e) => setSimV14(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">V17 (Latent)</label>
              <input
                type="number"
                step="0.1"
                value={simV17}
                onChange={(e) => setSimV17(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">V12 (Latent)</label>
              <input
                type="number"
                step="0.1"
                value={simV12}
                onChange={(e) => setSimV12(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">V10 (Latent)</label>
              <input
                type="number"
                step="0.1"
                value={simV10}
                onChange={(e) => setSimV10(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="col-span-2 md:col-span-6 flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={simulating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow"
              >
                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Calculate Fraud Risk Score</span>
              </button>
            </div>
          </form>

          {simResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Predicted Risk Score</span>
                <span className="text-xl font-bold text-white">
                  {(simResult.risk_score * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Priority Tier</span>
                <span className="mt-1 inline-block">
                  <StatusBadge type="priority" value={simResult.priority_tier} />
                </span>
              </div>
              <div className="md:col-span-3 text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">Generated Investigation Draft:</span>
                {simResult.draft_note.text}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column Layout */}
      {loading || !detail ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm">Retrieving transaction telemetry and latent components...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Transaction Metadata & Feature Waterfall */}
          <div className="space-y-6">
            {/* Transaction Overview Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Transaction Identifier
                  </span>
                  <h2 className="text-lg font-mono font-bold text-white">{detail.alert.id}</h2>
                </div>
                <StatusBadge type="priority" value={detail.alert.priority} />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Queue Rank</span>
                  <span className="font-mono font-bold text-cyan-400">#{detail.alert.rank} of 200</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Transaction Amount</span>
                  <span className="font-mono font-bold text-white">${detail.alert.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Elapsed Time</span>
                  <span className="font-mono text-slate-300">
                    {detail.alert.time.toFixed(0)}s ({(detail.alert.time / 3600).toFixed(1)}h)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Model Probability</span>
                  <span className="font-mono font-bold text-rose-400">
                    {(detail.alert.risk_score * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Evaluation Ground Truth</span>
                  <span className="font-mono text-slate-300">
                    {detail.alert.is_fraud_ground_truth === 1 ? (
                      <span className="text-rose-400 font-semibold">1 (Actual Fraud)</span>
                    ) : (
                      <span className="text-slate-400">0 (Legitimate)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="pt-2 space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Update Review Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Pending", "Under Review", "Confirmed Fraud", "Legitimate"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleReviewStatusUpdate(st)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        reviewStatus === st
                          ? "bg-slate-700 text-white border-cyan-500 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Latent PCA Feature Anomaly Breakdown */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Top Latent PCA Feature Anomalies
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Normalized Space</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Legitimate baseline centroid for PCA features is ≈ 0.00. Severe negative divergences (e.g. &lt; -3.00) align strongly with historical fraud patterns.
              </p>

              <div className="space-y-2.5">
                {Object.entries(detail.alert.top_features).map(([feat, val]) => (
                  <div key={feat} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-white">{feat}</span>
                      <span
                        className={`font-mono font-bold ${
                          val < -3.0 ? "text-rose-400" : val > 3.0 ? "text-amber-400" : "text-slate-300"
                        }`}
                      >
                        {val.toFixed(3)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          val < -3.0 ? "bg-rose-500" : val > 3.0 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(val) * 12)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Analyst Note Generator & Review Console */}
          <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Evidence-Grounded Investigation Note</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Rule-based draft derived strictly from transaction amount and latent PCA deviations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Approval State:</span>
                  <StatusBadge type="note" value={noteStatus} />
                </div>
              </div>

              {/* Analyst ID and Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Assigned Investigator</label>
                  <input
                    type="text"
                    value={analystName}
                    onChange={(e) => setAnalystName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white font-medium focus:outline-none focus:border-cyan-500 w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">Last Audit Timestamp</span>
                  <span className="text-slate-300 font-mono text-[11px] block mt-1">
                    {detail.investigation_note.updated_at || "Initial automated draft"}
                  </span>
                </div>
              </div>

              {/* Editable Note Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Investigation Findings & Escalation Rationale
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Human editing allowed before sign-off
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-cyan-500 shadow-inner"
                  placeholder="Enter or refine investigation evidence..."
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Standard Operating Protocol:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                  <li>Notes must be based strictly on observable telemetry; never fabricate customer identities.</li>
                  <li>Reviewing analyst must sign off manually before setting status to APPROVED.</li>
                  <li>In case of confirmed fraud, escalate to Tier-2 financial forensics queue.</li>
                </ul>
              </div>
            </div>

            {/* Note Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => handleSaveNote(false)}
                disabled={savingNote}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft (Keep Pending)</span>
              </button>

              <button
                onClick={() => handleSaveNote(true)}
                disabled={savingNote}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign & Approve Note (APPROVED)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvestigationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading investigation...</div>}>
      <InvestigationContent />
    </Suspense>
  );
}
