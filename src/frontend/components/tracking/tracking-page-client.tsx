"use client";
import { useState } from "react";
import { TrendingUp, CheckCircle2, Zap, BookOpen, Clock } from "lucide-react";
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
  { pct: 25, label: "Great start!", color: "bg-blue-500" },
  { pct: 50, label: "Halfway there!", color: "bg-violet-500" },
  { pct: 75, label: "Final stretch!", color: "bg-amber-500" },
  { pct: 100, label: "Complete!", color: "bg-emerald-500" },
];

export function TrackingPageClient({ token, employeeName, planTitle, phases, progress, linkReadSeconds }: TrackingPageClientProps) {
  const totalTasks = phases.reduce((s, p) => s + p.tasks.length, 0);
  const totalPhases = phases.length;
  const linkTaskCount = phases.flatMap(p => p.tasks).filter(t => t.type === "LINK").length;
  const [totalLinkSecs, setTotalLinkSecs] = useState(
    () => Object.values(linkReadSeconds).reduce((a, b) => a + b, 0)
  );

  const [completedCount, setCompletedCount] = useState(
    () => progress.filter((p) => p.status === "COMPLETED").length
  );

  const rate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Milestone reached
  const milestone = [...MILESTONES].reverse().find((m) => rate >= m.pct);

  const completedPhases = phases.filter((ph) =>
    ph.tasks.length > 0 && ph.tasks.every((t) => progress.some((p) => p.taskId === t.id && p.status === "COMPLETED"))
  ).length;

  function handleProgressChange(completed: number) {
    setCompletedCount(completed);
  }

  function handleReadTimeChange(addedSecs: number) {
    setTotalLinkSecs((prev) => prev + addedSecs);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">TrackPulse</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{employeeName}</span>
            <div className="flex items-center gap-2">
              <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${rate === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600">{rate}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <p className="text-sm text-indigo-600 font-semibold mb-1">Training Plan</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{planTitle}</h1>
          <p className="text-gray-500 text-sm">
            Hi <strong>{employeeName.split(" ")[0]}</strong> — work through the tasks below at your own pace.
            Your progress is saved automatically.
          </p>

          {/* Overall progress with milestones */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Overall Progress</span>
              <span className="font-bold text-gray-900">{completedCount} / {totalTasks} tasks</span>
            </div>
            {/* Progress bar with milestone markers */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${rate === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${rate}%` }}
              />
              {/* Milestone tick marks */}
              {[25, 50, 75].map((m) => (
                <div
                  key={m}
                  className={`absolute top-0 bottom-0 w-0.5 ${rate >= m ? "bg-white/60" : "bg-gray-300"}`}
                  style={{ left: `${m}%` }}
                />
              ))}
            </div>
            {/* Milestone labels */}
            <div className="flex justify-between text-xs text-gray-400 px-0.5">
              <span>0%</span>
              <span className={rate >= 25 ? "text-blue-500 font-medium" : ""}>25%</span>
              <span className={rate >= 50 ? "text-violet-500 font-medium" : ""}>50%</span>
              <span className={rate >= 75 ? "text-amber-500 font-medium" : ""}>75%</span>
              <span className={rate === 100 ? "text-emerald-500 font-medium" : ""}>100%</span>
            </div>

            {milestone && rate > 0 && (
              <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${
                rate === 100 ? "text-emerald-600" : rate >= 75 ? "text-amber-600" : rate >= 50 ? "text-violet-600" : "text-blue-600"
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                {rate === 100 ? "🎉 Plan complete! Outstanding work." : `${milestone.label} You're at ${rate}%.`}
              </div>
            )}
          </div>

          {/* Quick stats strip */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{completedPhases}/{totalPhases}</p>
                <p className="text-xs text-gray-400">Phases done</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{completedCount}</p>
                <p className="text-xs text-gray-400">Tasks completed</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">
                  {totalLinkSecs >= 60 ? `${Math.round(totalLinkSecs / 60)}m` : totalLinkSecs > 0 ? `${totalLinkSecs}s` : "—"}
                </p>
                <p className="text-xs text-gray-400">Reading time</p>
              </div>
            </div>
          </div>
        </div>

        <TrackingView
          token={token}
          phases={phases}
          progress={progress as any}
          linkReadSeconds={linkReadSeconds}
          onProgressChange={handleProgressChange}
          onReadTimeChange={handleReadTimeChange}
        />
      </main>
    </div>
  );
}
