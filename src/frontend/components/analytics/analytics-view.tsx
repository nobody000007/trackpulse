"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, BookOpen, TrendingUp, AlertTriangle,
  Clock, Zap, ChevronRight, BarChart2,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalEmployees: number;
    totalPlans: number;
    avgCompletionRate: number;
    atRiskCount: number;
    totalReadTimeSec: number;
    totalEvents: number;
  };
  riskBreakdown: { green: number; yellow: number; red: number };
  completionTrend: { day: string; count: number }[];
  topPerformers: { id: string; name: string; completionRate: number; riskLevel: string; planTitle: string | null }[];
  planPerformance: { planId: string; planTitle: string; avgCompletion: number; employeeCount: number; totalTasks: number }[];
}

const avatarColors = [
  "from-indigo-500 to-indigo-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-blue-500 to-blue-600",
];

function formatReadTime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-64 bg-white rounded-2xl border border-slate-200" />
          <div className="h-64 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, riskBreakdown, completionTrend, topPerformers, planPerformance } = data;
  const total = riskBreakdown.green + riskBreakdown.yellow + riskBreakdown.red || 1;
  const greenPct  = (riskBreakdown.green  / total) * 100;
  const yellowPct = (riskBreakdown.yellow / total) * 100;
  const redPct    = (riskBreakdown.red    / total) * 100;

  const maxTrend = Math.max(...completionTrend.map((d) => d.count), 1);

  const summaryCards = [
    { label: "Total Employees", value: summary.totalEmployees, icon: Users,         color: "from-indigo-500 to-indigo-600",  bg: "bg-indigo-50",  text: "text-indigo-600" },
    { label: "Training Plans",  value: summary.totalPlans,     icon: BookOpen,       color: "from-violet-500 to-violet-600",  bg: "bg-violet-50",  text: "text-violet-600" },
    { label: "Avg Completion",  value: `${summary.avgCompletionRate}%`, icon: TrendingUp, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "At Risk",         value: summary.atRiskCount,    icon: AlertTriangle,  color: "from-rose-500 to-rose-600",      bg: "bg-rose-50",    text: "text-rose-600" },
    { label: "Total Read Time", value: formatReadTime(summary.totalReadTimeSec), icon: Clock, color: "from-sky-500 to-sky-600", bg: "bg-sky-50", text: "text-sky-600" },
    { label: "Tracking Events", value: summary.totalEvents.toLocaleString(), icon: Zap, color: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.text}`} />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Trend + Risk row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Completion trend */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Task Completions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
              Completions
            </div>
          </div>

          {maxTrend === 1 && completionTrend.every((d) => d.count === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <BarChart2 className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No completions yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-px h-40 w-full">
              {completionTrend.map((d, i) => {
                const h = d.count > 0 ? Math.max((d.count / maxTrend) * 100, 6) : 0;
                const showLabel = i % 5 === 0;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-sm bg-indigo-500 group-hover:bg-indigo-600 transition-colors"
                        style={{ height: `${h}%`, minHeight: d.count > 0 ? 2 : 0 }}
                        title={`${formatDay(d.day)}: ${d.count}`}
                      />
                      {d.count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {d.count}
                        </div>
                      )}
                    </div>
                    {showLabel && (
                      <span className="text-[9px] text-slate-300 whitespace-nowrap">
                        {formatDay(d.day)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Risk distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-1">Risk Distribution</h2>
          <p className="text-xs text-slate-400 mb-5">Active employees</p>

          {summary.totalEmployees === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-sm text-slate-400">No employees yet</p>
            </div>
          ) : (
            <>
              {/* Donut */}
              <div className="flex justify-center mb-5">
                <div className="relative w-28 h-28">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: `conic-gradient(
                        #10b981 0% ${greenPct}%,
                        #f59e0b ${greenPct}% ${greenPct + yellowPct}%,
                        #ef4444 ${greenPct + yellowPct}% 100%
                      )`,
                    }}
                  />
                  <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-black text-gray-900 leading-none">{summary.totalEmployees}</p>
                      <p className="text-[9px] text-slate-400">total</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: "On track",  count: riskBreakdown.green,  color: "bg-emerald-400", text: "text-emerald-700" },
                  { label: "At risk",   count: riskBreakdown.yellow, color: "bg-amber-400",   text: "text-amber-700" },
                  { label: "Overdue",   count: riskBreakdown.red,    color: "bg-red-500",     text: "text-red-700" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs text-slate-600">{item.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${item.text}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performers + Plans row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top performers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-semibold text-gray-900 text-sm">Leaderboard</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by completion rate</p>
          </div>
          {topPerformers.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">No data yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {topPerformers.map((emp, idx) => {
                const initials = emp.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const grad = avatarColors[idx % avatarColors.length];
                const riskColor = emp.riskLevel === "RED" ? "bg-red-500" : emp.riskLevel === "YELLOW" ? "bg-amber-400" : "bg-emerald-400";
                return (
                  <li key={emp.id}>
                    <Link href={`/employees/${emp.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
                      <span className="w-5 text-xs font-bold text-slate-300 text-center shrink-0">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white`}>
                          {initials}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${riskColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.planTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{emp.completionRate}%</p>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${emp.completionRate}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Plan performance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-semibold text-gray-900 text-sm">Plan Performance</h2>
            <p className="text-xs text-slate-400 mt-0.5">Average completion per plan</p>
          </div>
          {planPerformance.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">No plans yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {planPerformance.map((plan) => (
                <li key={plan.planId}>
                  <Link href={`/plans/${plan.planId}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{plan.planTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                            style={{ width: `${plan.avgCompletion}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{plan.avgCompletion}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-gray-700">{plan.employeeCount} enrolled</p>
                      <p className="text-xs text-slate-400">{plan.totalTasks} tasks</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
