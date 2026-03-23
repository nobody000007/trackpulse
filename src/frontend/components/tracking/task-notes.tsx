"use client";
import { useState } from "react";
import { useTracking } from "@/frontend/hooks/use-tracking";

interface TaskNotesProps {
  token: string;
  taskId: string;
  initialNotes: string;
}

export function TaskNotes({ token, taskId, initialNotes }: TaskNotesProps) {
  const { updateProgress } = useTracking(token);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProgress(taskId, { notes });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes..."
        rows={2}
        className="w-full px-2 py-1 text-sm border border-gray-200 rounded resize-none"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-1 text-xs text-indigo-600 hover:underline disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Notes"}
      </button>
    </div>
  );
}
