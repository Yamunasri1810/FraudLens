"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  BarChart3,
  AlertTriangle,
  Search,
  Scale,
  FileText,
  Calculator,
  Activity,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

const navItems = [
  { href: "/", label: "Overview", icon: BarChart3, badge: "Dashboard" },
  { href: "/analytics", label: "Analytics", icon: Activity, badge: "EDA" },
  { href: "/alerts", label: "Smart Alerts", icon: AlertTriangle, badge: "Top 200" },
  { href: "/investigation", label: "Investigation", icon: Search, badge: "Workflow" },
  { href: "/evaluation", label: "Model Evaluation", icon: Scale, badge: "PR-AUC" },
  { href: "/reports", label: "Reports & Metadata", icon: FileText, badge: "Docs" },
  { href: "/roi", label: "Capacity & ROI", icon: Calculator, badge: "Planner" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.getHealth();
      if (res.status === "healthy") {
        setHealthStatus("online");
      } else {
        setHealthStatus("offline");
      }
    } catch {
      setHealthStatus("offline");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-950/95 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              FraudLens
              <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                PROD
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium leading-tight">
              AI Fraud Triage Platform
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isActive
                    ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                    : "bg-slate-900 text-slate-400"
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Capacity & System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Daily Capacity</span>
            <span className="text-[11px] font-bold text-emerald-400">200 Alerts / Day</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-full rounded-full" />
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>Quota Fixed</span>
            <span>0.173% Fraud Rate</span>
          </div>
        </div>

        {/* Backend Health Check Indicator */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === "online"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : healthStatus === "checking"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              }`}
            />
            <span className="text-slate-400 font-medium text-[11px]">
              {healthStatus === "online"
                ? "Backend Live"
                : healthStatus === "checking"
                ? "Connecting..."
                : "Backend Offline"}
            </span>
          </div>
          <button
            onClick={checkHealth}
            disabled={isRefreshing}
            title="Refresh backend status"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </aside>
  );
}
