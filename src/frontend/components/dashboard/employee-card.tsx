"use client";
import { RiskBadge } from "./risk-badge";
import { ProgressBar } from "./progress-bar";
import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, BookOpen } from "lucide-react";

interface EmployeeCardProps {
  employee: {
    id: string;
    name: string;
    email: string;
    assignments: Array<{
      id: string;
      planId: string;
      completionRate: number;
      riskLevel: string;
      completedTasks: number;
      totalTasks: number;
      lastActivity: Date | null;
      plan?: { id: string; title: string };
    }>;
  };
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const assignment = employee.assignments[0];
  const initials = employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden">
      {/* Risk color strip */}
      {assignment && (
        <div className={`h-1 ${
          assignment.riskLevel === "GREEN" ? "bg-emerald-400" :
          assignment.riskLevel === "YELLOW" ? "bg-amber-400" : "bg-red-500"
        }`} />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold shrink-0">
                {initials}
              </div>
              {assignment && (
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  assignment.riskLevel === "GREEN" ? "bg-emerald-400" :
                  assignment.riskLevel === "YELLOW" ? "bg-amber-400" : "bg-red-500"
                }`} />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{employee.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{employee.email}</p>
            </div>
          </div>
          {assignment && <RiskBadge level={assignment.riskLevel as "GREEN" | "YELLOW" | "RED"} />}
        </div>

        {assignment ? (
          <>
            {/* Current plan */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate font-medium">{assignment.plan?.title}</span>
            </div>

            {/* Progress bar */}
            <ProgressBar value={assignment.completionRate} />

            {/* Stats row */}
            <div className="flex items-center justify-between mt-3 mb-2">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {assignment.completedTasks}/{assignment.totalTasks}
                </span>
                {assignment.lastActivity && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(assignment.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {/* What they're working on */}
            {(assignment as any).currentTask ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <span className="truncate">Working on: <strong>{(assignment as any).currentTask.title}</strong></span>
              </div>
            ) : assignment.completionRate === 100 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Plan completed!
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {assignment.lastActivity ? "Waiting for next session" : "Not started yet"}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
              <Link
                href={`/plans/${assignment.plan?.id}/employee/${assignment.id}`}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View progress <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-2">
            <p className="text-xs text-gray-400 italic mb-3">No active plan assigned</p>
            <Link
              href="/plans"
              className="text-xs text-indigo-600 hover:underline"
            >
              Assign a plan →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
