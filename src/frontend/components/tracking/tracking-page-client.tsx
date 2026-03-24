"use client";
import { useState } from "react";
import {
  TrendingUp, CheckCircle2, Clock, LayoutList,
  Award, Target, BookOpen, ExternalLink,
} from "lucide-react";
import { TrackingView } from "./tracking-view";

interface Attachment {
  id: string; filename: string; blobUrl: string; fileType: string; fileSize: number;
}
interface Phase {
  id: string;
  title: string;
  description?: string | null;
  tasks: { id: string; title: string; description?: string | null; type: string; priority: string; url?: string | null; content?: string | null; dueDate?: string | null; attachments?: Attachment[] }[];
}

interface Progress {
  taskId: string;
  status: string;
  notes?: string | null;
}

interface TrackingPageClientProps {
  token: string;
  employeeName: string;
  planTitle: string;
  phases: Phase[];
  progress: Progress[];
  linkReadSeconds: Record<string, number>;
  statusNote: string;
}

const MILESTONES = [
  { pct: 25, label: "Great start!", color: "text-blue-600" },
  { pct: 50, label: "Halfway there!", color: "text-violet-600" },
  { pct: 75, label: "Final stretch!", color: "text-amber-600" },
  { pct: 100, label: "Plan complete!", color: "text-emerald-600" },
];

export function TrackingPageClient({ token, employeeName, planTitle, phases, progress, linkReadSeconds }: TrackingPageClientProps) {
  const totalTasks = phases.reduce((s, p) => s + p.tasks.length, 0);
  const totalPhases = phases.length;
  const [readSecsByTask, setReadSecsByTask] = useState<Record<string, number>>(
    () => ({ ...linkReadSeconds })
  );
  const totalLinkSecs = Object.values(readSecsByTask).reduce((a, b) => a + b, 0);

  const [completedCount, setCompletedCount] = useState(
    () => progress.filter((p) => p.status === "COMPLETED").length
  );

  // Collect all LINK tasks with a URL across all phases
  const linkTasks = phases.flatMap((ph) =>
    ph.tasks.filter((t) => t.type === "LINK" && t.url)
  );

  const rate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const milestone = [...MILESTONES].reverse().find((m) => rate >= m.pct);

  const completedPhases = phases.filter((ph) =>
    ph.tasks.length > 0 && ph.tasks.every((t) => progress.some((p) => p.taskId === t.id && p.status === "COMPLETED"))
  ).length;

  const remainingTasks = totalTasks - completedCount;

  function handleProgressChange(completed: number) {
    setCompletedCount(completed);
  }
  function handleReadTimeChange(taskId: string, addedSecs: number) {
    setReadSecsByTask((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? 0) + addedSecs,
    }));
  }

  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">TrackPulse</span>
            <span className="hidden sm:block text-gray-300 mx-1">|</span>
            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-xs">{planTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rate === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700">{rate}%</span>
            </div>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-700">{initials}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* ── Left sidebar ── */}
          <aside className="w-72 shrink-0 sticky top-20 space-y-4">

            {/* Plan info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Training Plan</p>
              <h1 className="text-lg font-bold text-gray-900 leading-snug mb-3">{planTitle}</h1>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-700">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{employeeName}</p>
                  <p className="text-xs text-gray-400">Assigned trainee</p>
                </div>
              </div>
            </div>

            {/* Overall progress */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                <span className="text-lg font-bold text-gray-900">{rate}%</span>
              </div>

              {/* Segmented progress bar */}
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rate === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${rate}%` }}
                />
                {[25, 50, 75].map((m) => (
                  <div
                    key={m}
                    className={`absolute top-0 bottom-0 w-px ${rate >= m ? "bg-white/50" : "bg-gray-200"}`}
                    style={{ left: `${m}%` }}
                  />
                ))}
              </div>

              <div className="flex justify-between text-[11px] text-gray-400 mb-3">
                <span>0%</span>
                <span className={rate >= 25 ? "text-blue-500 font-medium" : ""}>25%</span>
                <span className={rate >= 50 ? "text-violet-500 font-medium" : ""}>50%</span>
                <span className={rate >= 75 ? "text-amber-500 font-medium" : ""}>75%</span>
                <span className={rate === 100 ? "text-emerald-500 font-medium" : ""}>100%</span>
              </div>

              {milestone && rate > 0 && (
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${milestone.color}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {rate === 100 ? "🎉 Outstanding work!" : `${milestone.label} You're at ${rate}%.`}
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{remainingTasks}</p>
                <p className="text-xs text-gray-400">Remaining</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2">
                  <LayoutList className="w-4 h-4 text-violet-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">{completedPhases}/{totalPhases}</p>
                <p className="text-xs text-gray-400">Phases done</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {totalLinkSecs >= 60 ? `${Math.round(totalLinkSecs / 60)}m` : totalLinkSecs > 0 ? `${totalLinkSecs}s` : "—"}
                </p>
                <p className="text-xs text-gray-400">Read time</p>
              </div>
            </div>

            {/* Per-URL reading time breakdown */}
            {linkTasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                  <p className="text-xs font-semibold text-gray-700">Reading Activity</p>
                </div>
                <div className="space-y-2.5">
                  {linkTasks.map((task) => {
                    const secs = readSecsByTask[task.id] ?? 0;
                    const timeLabel = secs >= 60 ? `${Math.round(secs / 60)}m` : secs > 0 ? `${secs}s` : null;
                    const hostname = task.url ? (() => { try { return new URL(task.url).hostname.replace("www.", ""); } catch { return task.url; } })() : "";
                    return (
                      <div key={task.id} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${secs > 0 ? "bg-teal-400" : "bg-gray-200"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{task.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={task.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-500 hover:underline truncate max-w-[140px]"
                            >
                              {hostname}
                            </a>
                            <ExternalLink className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          </div>
                        </div>
                        <span className={`text-xs font-semibold shrink-0 ${secs > 0 ? "text-teal-600" : "text-gray-300"}`}>
                          {timeLabel ?? "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completion callout */}
            {rate === 100 && (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white text-center">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-90" />
                <p className="font-bold text-sm mb-0.5">Plan Complete!</p>
                <p className="text-xs text-emerald-100">You've finished all {totalTasks} tasks. Great job!</p>
              </div>
            )}

            {/* Tips */}
            {rate < 100 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                  <p className="text-xs font-semibold text-indigo-700">How it works</p>
                </div>
                <ul className="space-y-1.5 text-xs text-indigo-600 list-disc list-inside leading-relaxed">
                  <li>Work at your own pace</li>
                  <li>Progress saves automatically</li>
                  <li>Use "Need help" if you get stuck</li>
                  <li>Submit your work when done</li>
                </ul>
              </div>
            )}
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            {/* Page header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Hi {employeeName.split(" ")[0]}, here&apos;s your training plan
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Work through the phases below. Your progress is saved automatically.
              </p>
            </div>

            <TrackingView
              token={token}
              phases={phases}
              progress={progress as any}
              linkReadSeconds={readSecsByTask}
              onProgressChange={handleProgressChange}
              onReadTimeChange={handleReadTimeChange}
            />
          </main>

        </div>
      </div>
    </div>
  );
}
