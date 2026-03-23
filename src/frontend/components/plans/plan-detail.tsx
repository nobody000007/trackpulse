"use client";
import { useState, useEffect } from "react";
import { api } from "@/frontend/lib/api-client";
import { useEmployees } from "@/frontend/hooks/use-employees";
import {
  ChevronDown, ChevronRight, Users, Calendar, Layers,
  Link as LinkIcon, AlertCircle, Loader2, UserPlus, Copy, CheckCheck,
  FileText, Zap, Wrench, BookOpen, ExternalLink, Paperclip
} from "lucide-react";
import { TaskAttachments, type Attachment } from "./task-attachments";

const TASK_TYPE_COLORS: Record<string, string> = {
  READ: "bg-blue-50 text-blue-700 border-blue-200",
  WATCH: "bg-purple-50 text-purple-700 border-purple-200",
  ACTION: "bg-amber-50 text-amber-700 border-amber-200",
  QUIZ: "bg-green-50 text-green-700 border-green-200",
  MEET: "bg-rose-50 text-rose-700 border-rose-200",
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-400",
  MEDIUM: "text-amber-500",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
};

interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  priority: string;
  url?: string | null;
  dueDate?: string | null;
  attachments: Attachment[];
}
interface Phase { id: string; title: string; orderIndex: number; tasks: Task[] }
interface Assignment {
  id: string; token: string; status: string;
  employee: { id: string; name: string; email: string };
}
interface Plan {
  id: string; title: string; description?: string | null; createdAt: string;
  phases: Phase[];
  assignments: Assignment[];
}

export function PlanDetail({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set());
  const [assignError, setAssignError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { employees } = useEmployees();

  useEffect(() => {
    api.plans.get(planId)
      .then((data) => {
        const p = data as Plan;
        setPlan(p);
        // Open all phases by default
        setOpenPhases(new Set(p.phases.map((ph) => ph.id)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [planId]);

  function togglePhase(id: string) {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleEmp(id: string) {
    setSelectedEmps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (selectedEmps.size === 0) return;
    setAssigning(true);
    setAssignError("");
    try {
      const results = await Promise.all(
        Array.from(selectedEmps).map((empId) => api.assignments.create({ planId, employeeId: empId }))
      );
      const newAssignments = results as Assignment[];
      setPlan((prev) => prev ? { ...prev, assignments: [...prev.assignments, ...newAssignments] } : prev);
      setSelectedEmps(new Set());
    } catch (e: any) {
      setAssignError(e.message ?? "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/track/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  const assignedIds = new Set(plan?.assignments.map((a) => a.employee.id) ?? []);
  const availableEmployees = employees.filter((e) => !assignedIds.has(e.id));
  const totalTasks = plan?.phases.reduce((acc, p) => acc + p.tasks.length, 0) ?? 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error || "Plan not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{plan.title}</h1>
          {plan.description && <p className="text-gray-500 text-sm mb-4">{plan.description}</p>}
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {plan.phases.length} phases
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              {totalTasks} tasks
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              {plan.assignments.length} assigned
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Phases & Tasks */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Training Content</h2>
          {plan.phases.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
              No phases yet.
            </div>
          ) : (
            plan.phases.map((phase, idx) => {
              const isOpen = openPhases.has(phase.id);
              return (
                <div key={phase.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <span className="font-semibold text-gray-900">{phase.title}</span>
                      <span className="text-xs text-gray-400">{phase.tasks.length} tasks</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isOpen && phase.tasks.length > 0 && (
                    <ul className="border-t border-gray-100 divide-y divide-gray-50">
                      {phase.tasks.map((task) => (
                        <li key={task.id} className="flex items-start gap-3 px-5 py-3.5">
                          <div className="mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${TASK_TYPE_COLORS[task.type] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {task.type}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                              <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? "text-gray-400"}`}>
                                {task.priority}
                              </span>
                              {task.attachments.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                  <Paperclip className="w-3 h-3" />{task.attachments.length}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>
                            )}
                            {task.url && (
                              <a
                                href={task.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
                              >
                                <ExternalLink className="w-3 h-3" /> {task.url}
                              </a>
                            )}
                            <div className="mt-2">
                              <TaskAttachments taskId={task.id} initial={task.attachments} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isOpen && phase.tasks.length === 0 && (
                    <p className="px-5 py-3 text-sm text-gray-400 border-t border-gray-100">No tasks in this phase.</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Assign */}
        <div className="space-y-4">
          {/* Assign form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-500" /> Assign Employee
            </h2>
            {availableEmployees.length === 0 ? (
              <p className="text-xs text-gray-400">
                {employees.length === 0
                  ? "Add employees first in the Employees tab."
                  : "All employees are already assigned."}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Select one or more employees:</p>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {availableEmployees.map((e) => {
                    const checked = selectedEmps.has(e.id);
                    return (
                      <li key={e.id}>
                        <label className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${checked ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEmp(e.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                            <p className="text-xs text-gray-400 truncate">{e.email}</p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {assignError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {assignError}
                  </p>
                )}
                <button
                  onClick={handleAssign}
                  disabled={assigning || selectedEmps.size === 0}
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {assigning
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Assigning…</>
                    : selectedEmps.size > 0
                    ? `Assign ${selectedEmps.size} Employee${selectedEmps.size > 1 ? "s" : ""}`
                    : "Select employees above"}
                </button>
              </div>
            )}
          </div>

          {/* Assigned employees */}
          {plan.assignments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">Assigned ({plan.assignments.length})</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {plan.assignments.map((assignment) => {
                  const initials = assignment.employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  const copied = copiedToken === assignment.token;
                  return (
                    <li key={assignment.id} className="px-5 py-3">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{assignment.employee.name}</p>
                          <p className="text-xs text-gray-400 truncate">{assignment.employee.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyLink(assignment.token)}
                          className="flex items-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                        >
                          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied!" : "Copy link"}
                        </button>
                        <a
                          href={`/plans/${planId}/employee/${assignment.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                        >
                          Stats
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
