"use client";
import Link from "next/link";
import { Calendar, Users, Layers, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

interface PlanCardProps {
  plan: {
    id: string;
    title: string;
    description?: string | null;
    createdAt: string | Date;
    phases: Array<{ id: string; tasks: Array<{ id: string }> }>;
    assignments: Array<{ id: string }>;
  };
  onDelete: (id: string) => Promise<void>;
}

export function PlanCard({ plan, onDelete }: PlanCardProps) {
  const [deleting, setDeleting] = useState(false);
  const taskCount = plan.phases.reduce((acc, p) => acc + (p.tasks?.length ?? 0), 0);
  const date = new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    setDeleting(true);
    try { await onDelete(plan.id); } catch { setDeleting(false); }
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{plan.title}</h3>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {plan.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{plan.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {plan.phases.length} phase{plan.phases.length !== 1 ? "s" : ""}
          </span>
          <span className="text-gray-300">·</span>
          <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            {plan.assignments.length} assigned
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" /> {date}
          </span>
          <Link
            href={`/plans/${plan.id}`}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
