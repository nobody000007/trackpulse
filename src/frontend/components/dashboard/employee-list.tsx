"use client";
import { useDashboard } from "@/frontend/hooks/use-dashboard";
import Link from "next/link";
import { UserPlus, BookOpen, ArrowRight, MousePointerClick } from "lucide-react";

const RISK_CONFIG = {
  GREEN:  { dot: "bg-emerald-400", bar: "bg-emerald-500", label: "On Track",        badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  YELLOW: { dot: "bg-amber-400",   bar: "bg-amber-500",   label: "Needs Attention", badge: "bg-amber-50  text-amber-700  ring-1 ring-amber-200"  },
  RED:    { dot: "bg-red-500",     bar: "bg-red-500",     label: "At Risk",         badge: "bg-red-50    text-red-700    ring-1 ring-red-200"    },
};

function timeAgo(date: string | Date | null): string | null {
  if (!date) return null;
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

export function EmployeeList() {
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-36 animate-pulse" />
          <div className="h-7 bg-slate-100 rounded-lg w-28 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-32" />
              <div className="h-2.5 bg-slate-100 rounded w-48" />
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const employees = (stats?.employees ?? []) as any[];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Team Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">{employees.length} member{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/employees" className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
          <UserPlus className="w-3.5 h-3.5" /> Add employee
        </Link>
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <UserPlus className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No team members yet</p>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">Add your first team member and assign them a training plan to get started.</p>
          <Link href="/employees" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20">
            <UserPlus className="w-4 h-4" /> Add first employee
          </Link>
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div className="grid grid-cols-[minmax(180px,2fr)_minmax(140px,2fr)_minmax(140px,1.5fr)_100px_130px_40px] px-6 py-2.5 border-b border-slate-100 bg-slate-50/60">
            {["Employee", "Plan", "Progress", "Last Active", "Status", ""].map((h, i) => (
              <div key={i} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {employees.map((emp: any, empIdx: number) => {
              const asgn = emp.assignments?.[0];
              const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const risk = (asgn?.riskLevel ?? "GREEN") as keyof typeof RISK_CONFIG;
              const cfg = RISK_CONFIG[risk];
              const ago = timeAgo(asgn?.lastActivity ?? null);
              const avatarGrad = avatarColors[empIdx % avatarColors.length];

              return (
                <Link
                  key={emp.id}
                  href={`/employees/${emp.id}`}
                  className="grid grid-cols-[minmax(180px,2fr)_minmax(140px,2fr)_minmax(140px,1.5fr)_100px_130px_40px] px-6 py-4 hover:bg-indigo-50/30 transition-colors group items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGrad} text-white text-xs font-bold flex items-center justify-center shadow-sm`}>
                        {initials}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dot}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                      <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                    </div>
                  </div>

                  <div className="min-w-0 pr-2">
                    {asgn ? (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                        <span className="text-xs font-medium text-gray-600 truncate">{asgn.plan?.title}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">None</span>
                    )}
                  </div>

                  <div>
                    {asgn ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{asgn.completedTasks}/{asgn.totalTasks}</span>
                          <span className="font-bold text-gray-800">{asgn.completionRate}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${asgn.completionRate}%` }} />
                        </div>
                      </div>
                    ) : <span className="text-xs text-slate-200">—</span>}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <MousePointerClick className="w-3 h-3 text-slate-300" />
                    <span className={ago ? "text-gray-500" : "text-slate-300"}>{ago ?? "Never"}</span>
                  </div>

                  <div>
                    {asgn ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
