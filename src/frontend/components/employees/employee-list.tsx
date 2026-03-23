"use client";
import { Mail, Briefcase, Trash2, BookOpen, Clock, AlertCircle, Loader2, ChevronRight, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const RISK_DOT: Record<string, string> = {
  GREEN: "bg-emerald-400",
  YELLOW: "bg-amber-400",
  RED: "bg-red-500",
};
const RISK_LABEL: Record<string, string> = {
  GREEN: "On Track",
  YELLOW: "Needs Attention",
  RED: "At Risk",
};

function EmployeeSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3.5 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-100 rounded w-48" />
        <div className="h-2.5 bg-gray-100 rounded w-full mt-2" />
      </div>
    </div>
  );
}

interface EmployeeListProps {
  employees?: any[];
  loading?: boolean;
  error?: string | null;
  deleteEmployee?: (id: string) => Promise<void>;
}

export function EmployeeList({ employees: empProp, loading: loadProp, error: errProp, deleteEmployee: deleteProp }: EmployeeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Support both prop-driven (from container) and standalone usage
  const employees = empProp ?? [];
  const loading = loadProp ?? false;
  const error = errProp ?? null;

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    if (!confirm(`Remove ${name} from your team? This cannot be undone.`)) return;
    setDeletingId(id);
    try { await deleteProp?.(id); } finally { setDeletingId(null); }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => <EmployeeSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
        <p className="text-gray-400 text-sm">No employees yet. Add your first one →</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Your Team</h2>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">{employees.length}</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {employees.map((emp) => {
          const initials = emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
          const asgn = emp.currentAssignment;
          const risk = emp.riskLevel ?? "GREEN";
          const isDeleting = deletingId === emp.id;

          // Format last interaction
          let lastInteraction: string | null = null;
          if (asgn?.lastActivity) {
            const d = new Date(asgn.lastActivity);
            const diffMs = Date.now() - d.getTime();
            const diffH = Math.floor(diffMs / 3600000);
            if (diffH < 1) lastInteraction = "Just now";
            else if (diffH < 24) lastInteraction = `${diffH}h ago`;
            else {
              const diffD = Math.floor(diffH / 24);
              lastInteraction = diffD === 1 ? "Yesterday" : `${diffD}d ago`;
            }
          }

          return (
            <li key={emp.id} className="group relative hover:bg-gray-50 transition-colors">
              <Link href={`/employees/${emp.id}`} className="flex items-start gap-4 px-5 py-4 pr-16">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                    {initials}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${RISK_DOT[risk]}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                    <span className={`text-xs font-medium ${
                      risk === "GREEN" ? "text-emerald-600" :
                      risk === "YELLOW" ? "text-amber-600" : "text-red-600"
                    }`}>
                      {RISK_LABEL[risk]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</span>
                    {emp.role && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{emp.role}</span>}
                  </div>

                  {asgn ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <BookOpen className="w-3 h-3 text-indigo-400" />
                        <span className="truncate max-w-[140px] font-medium">{asgn.planTitle}</span>
                        {(asgn.activePlansCount ?? 1) > 1 && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full">
                            +{asgn.activePlansCount - 1} more
                          </span>
                        )}
                      </span>
                      {asgn.currentTask && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          {asgn.currentTask.title}
                        </span>
                      )}
                      {lastInteraction && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MousePointerClick className="w-3 h-3" /> {lastInteraction}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No plan assigned</p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 mt-3" />
              </Link>

              <button
                onClick={(e) => handleDelete(e, emp.id, emp.name)}
                disabled={isDeleting}
                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-10"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
