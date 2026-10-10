"use client";

import React from "react";

interface StatusBadgeProps {
  type: "priority" | "review" | "note";
  value: string;
}

export default function StatusBadge({ type, value }: StatusBadgeProps) {
  if (type === "priority") {
    switch (value) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500 animate-pulse" />
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            LOW
          </span>
        );
    }
  }

  if (type === "review") {
    switch (value) {
      case "Confirmed Fraud":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/90 text-red-300 border border-red-500/40">
            Confirmed Fraud
          </span>
        );
      case "Legitimate":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            Legitimate
          </span>
        );
      case "Under Review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
            Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Pending
          </span>
        );
    }
  }

  if (type === "note") {
    if (value === "APPROVED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          APPROVED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30">
        PENDING_APPROVAL
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
      {value}
    </span>
  );
}
