"use client";
import { useDashboard } from "@/frontend/hooks/use-dashboard";
import { Users, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";

const statConfig = [
  {
    key: "totalEmployees" as const,
    label: "Total Employees",
    icon: Users,
    gradient: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-500/25",
    ring: "bg-blue-400/20",
    sub: "Team members enrolled",
  },
  {
    key: "totalPlans" as const,
    label: "Active Plans",
    icon: BookOpen,
    gradient: "from-violet-500 to-violet-700",
    shadow: "shadow-violet-500/25",
    ring: "bg-violet-400/20",
    sub: "Training programs running",
  },
  {
    key: "avgCompletionRate" as const,
    label: "Avg Completion",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-emerald-700",
    shadow: "shadow-emerald-500/25",
    ring: "bg-emerald-400/20",
    sub: "Across all assignments",
    suffix: "%",
  },
  {
    key: "atRiskCount" as const,
    label: "At Risk",
    icon: AlertTriangle,
    gradient: "from-rose-500 to-rose-700",
    shadow: "shadow-rose-500/25",
    ring: "bg-rose-400/20",
    sub: "Need attention now",
  },
];

export function StatsOverview() {
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white/60 animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((stat) => {
        const value = stats?.[stat.key] ?? 0;
        const display = (stat as any).suffix ? `${value}${(stat as any).suffix}` : String(value);
        return (
          <div
            key={stat.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-5 shadow-xl ${stat.shadow}`}
          >
            <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full ${stat.ring}`} />
            <div className={`absolute -bottom-8 -left-4 w-40 h-40 rounded-full ${stat.ring} opacity-50`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-4xl font-black text-white leading-none">{display}</p>
              <p className="text-white/50 text-xs mt-2">{stat.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
