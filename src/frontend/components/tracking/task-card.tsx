"use client";
import { useState } from "react";
import { useTracking } from "@/frontend/hooks/use-tracking";
import { TaskNotes } from "./task-notes";
import type { ProgressStatus } from "@/shared/types/enums";

interface TaskCardProps {
  token: string;
  task: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    priority: string;
    url?: string | null;
  };
  initialStatus: ProgressStatus;
  initialNotes: string;
}

export function TaskCard({ token, task, initialStatus, initialNotes }: TaskCardProps) {
  const { updateProgress } = useTracking(token);
  const [status, setStatus] = useState<ProgressStatus>(initialStatus);

  async function handleStatusChange(newStatus: ProgressStatus) {
    setStatus(newStatus);
    await updateProgress(task.id, { status: newStatus });
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
        </div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as ProgressStatus)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      {task.url && (
        <a
          href={`/api/track/${token}/link?url=${encodeURIComponent(task.url)}&taskId=${task.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline mt-2"
        >
          Open Resource ↗
        </a>
      )}
      <TaskNotes token={token} taskId={task.id} initialNotes={initialNotes} />
    </div>
  );
}
