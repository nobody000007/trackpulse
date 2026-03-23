"use client";
import { useEffect, useState } from "react";
import { api } from "@/frontend/lib/api-client";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, TrendingUp, Activity, Copy, CheckCheck, Mail, Loader2 } from "lucide-react";

const RISK_STYLES = {
  GREEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  YELLOW: "bg-amber-50 text-amber-700 border-amber-200",
  RED: "bg-red-50 text-red-700 border-red-200",
};
const RISK_LABELS = { GREEN: "On Track", YELLOW: "Needs Attention", RED: "At Risk" };

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  NOT_STARTED: "bg-gray-100 text-gray-500",
};

interface AssignmentDetail {
  id: string; token: string; status: string;
  completionRate: number; riskLevel: "GREEN" | "YELLOW" | "RED";
  lastActivity: string | null; totalTasks: number; completedTasks: number;
  employee: { id: string; name: string; email: string };
  plan: {
    id: string; title: string;
    phases: Array<{
      id: string; title: string; orderIndex: number;
      tasks: Array<{
        id: string; title: string; type: string; priority: string;
        progress: Array<{ status: string; notes?: string | null }>;
      }>;
    }>;
  };
  events: Array<{ id: string; eventType: string; timestamp: string; readTimeSec?: number | null; scrollDepthPct?: number | null }>;
}

export default function EmployeeStatsPage({ params }: { params: { id: string; empId: string } }) {
  const [data, setData] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudge, setNudge] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    api.assignments.get(params.empId)
      .then((d) => setData(d as AssignmentDetail))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.empId]);

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(`${window.location.origin}/track/${data.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generateNudge() {
    if (!data) return;
    setNudgeLoading(true);
    try {
      const result = await api.ai.nudge(data.id);
      setNudge(result as any);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setNudgeLoading(false);
    }
  }

  async function sendNudge() {
    if (!data) return;
    setNudgeLoading(true);
    try {
      await api.ai.nudge(data.id, true);
      setNudge(null);
      alert("Email sent!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setNudgeLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertCircle className="w-4 h-4" /> {error || "Not found"}
      </div>
    );
  }

  const riskStyle = RISK_STYLES[data.riskLevel];
  const totalReadTime = data.events.reduce((acc, e) => acc + (e.readTimeSec ?? 0), 0);
  const openCount = data.events.filter((e) => e.eventType === "OPEN").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/plans/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plan
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                {data.employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{data.employee.name}</h1>
                <p className="text-sm text-gray-500">{data.employee.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Plan: <span className="font-medium text-gray-800">{data.plan.title}</span></p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskStyle}`}>
              {RISK_LABELS[data.riskLevel]}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={generateNudge}
              disabled={nudgeLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {nudgeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              AI Nudge
            </button>
          </div>
        </div>
      </div>

      {/* Nudge preview */}
      {nudge && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">AI-Generated Follow-up Email</h3>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-700 mb-1">Subject: {nudge.subject}</p>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{nudge.body}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={sendNudge}
              disabled={nudgeLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {nudgeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Send Email
            </button>
            <button onClick={() => setNudge(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Completion", value: `${data.completionRate}%`, icon: TrendingUp, color: "text-indigo-500" },
          { label: "Tasks Done", value: `${data.completedTasks}/${data.totalTasks}`, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Opens", value: openCount, icon: Activity, color: "text-blue-500" },
          { label: "Read Time", value: totalReadTime > 60 ? `${Math.round(totalReadTime / 60)}m` : `${totalReadTime}s`, icon: Clock, color: "text-violet-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress per phase */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Task Progress</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {data.plan.phases.map((phase) => (
            <div key={phase.id} className="px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{phase.title}</h3>
              <ul className="space-y-2">
                {phase.tasks.map((task) => {
                  const progress = task.progress[0];
                  const status = progress?.status ?? "NOT_STARTED";
                  return (
                    <li key={task.id} className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
                        {status.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-700">{task.title}</span>
                      <span className="ml-auto text-xs text-gray-400">{task.type}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Recent events */}
      {data.events.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {data.events.slice(0, 20).map((event) => (
              <li key={event.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-gray-700 font-medium">{event.eventType}</span>
                {event.readTimeSec != null && (
                  <span className="text-gray-400 text-xs">{event.readTimeSec}s read</span>
                )}
                {event.scrollDepthPct != null && (
                  <span className="text-gray-400 text-xs">{event.scrollDepthPct}% scroll</span>
                )}
                <span className="ml-auto text-gray-400 text-xs">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
