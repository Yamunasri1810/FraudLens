"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "rose" | "emerald" | "amber" | "blue";
  trend?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "blue",
  trend,
}: MetricCardProps) {
  const badgeClasses = {
    rose: "bg-rose-950/70 text-rose-300 border-rose-500/30",
    emerald: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-950/70 text-amber-300 border-amber-500/30",
    blue: "bg-blue-950/70 text-blue-300 border-blue-500/30",
  }[badgeColor];

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-lg hover:border-slate-700 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
          <Icon className="w-4 h-4 text-slate-300" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="text-emerald-400 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
}
