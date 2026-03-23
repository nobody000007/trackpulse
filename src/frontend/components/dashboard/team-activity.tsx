"use client";
import { useDashboard } from "@/frontend/hooks/use-dashboard";
import Link from "next/link";
import { AlertTriangle, Clock, BookOpen, UserPlus, TrendingUp, ArrowRight, Zap } from "lucide-react";

const RISK_DOT: Record<string, string> = {
  GREEN:  "bg-emerald-400",
  YELLOW: "bg-amber-400",
  RED:    "bg-red-500",
};

function timeAgo(date: string | Date | null): string {
  if (!date) return "Never";
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

const avatarColors = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-indigo-500 to-indigo-600",
];

export function TeamActivity() {
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="h-48 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const employees = (stats?.employees ?? []) as any[];
  const atRisk = employees.filter((e: any) => e.assignments?.[0]?.riskLevel === "RED");

  return (
    <div className="space-y-4">
      {/* At Risk Alert */}
      {atRisk.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-sm font-semibold text-rose-800">{atRisk.length} at risk</p>
          </div>
          <div className="space-y-1.5">
            {atRisk.map((emp: any) => {
              const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <Link key={emp.id} href={`/employees/${emp.id}`}
                  className="flex items-center gap-2.5 text-sm hover:opacity-80 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <span className="text-rose-800 font-medium flex-1 truncate text-xs">{emp.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="space-y-1">
          {[
            { href: "/employees", icon: UserPlus, label: "Add Employee", sub: "Invite a team member", color: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100" },
            { href: "/plans/new", icon: Zap, label: "Create Plan", sub: "AI-powered training", color: "bg-violet-50 text-violet-600 group-hover:bg-violet-100" },
            { href: "/plans", icon: BookOpen, label: "Browse Plans", sub: "View all programs", color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="font-semibold text-gray-900 text-sm">Activity</h2>
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
            <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">No activity yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {employees.map((emp: any, empIdx: number) => {
              const asgn = emp.assignments?.[0];
              const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const risk = asgn?.riskLevel ?? "GREEN";
              const lastActivity = asgn?.lastActivity ?? null;
              const avatarGrad = avatarColors[empIdx % avatarColors.length];

              return (
                <li key={emp.id}>
                  <Link href={`/employees/${emp.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors group">
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white`}>
                        {initials}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${RISK_DOT[risk]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                      {asgn ? (
                        <p className="text-xs text-slate-400 truncate">{asgn.completionRate}% · {asgn.plan?.title}</p>
                      ) : (
                        <p className="text-xs text-slate-300 italic">No plan</p>
                      )}
                    </div>
                    <p className={`text-xs font-medium shrink-0 ${lastActivity ? "text-slate-500" : "text-slate-300"}`}>
                      {timeAgo(lastActivity)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
