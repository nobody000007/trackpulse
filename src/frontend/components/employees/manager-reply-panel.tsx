"use client";
import { useState, useEffect } from "react";
import { Send, Loader2, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

interface HelpTask {
  taskId: string;
  taskTitle: string;
  message: string;
}

interface Reply {
  id: string;
  taskId: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export function ManagerReplyPanel({
  assignmentId,
  helpTasks,
}: {
  assignmentId: string;
  helpTasks: HelpTask[];
}) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTask, setOpenTask] = useState<string | null>(helpTasks[0]?.taskId ?? null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/assignments/${assignmentId}/reply`)
      .then((r) => r.json())
      .then((data) => { setReplies(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [assignmentId]);

  async function sendReply(taskId: string, taskTitle: string) {
    const message = drafts[taskId]?.trim();
    if (!message) return;
    setSending((prev) => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, message }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setReplies((prev) => [
          { id, taskId, message, readAt: null, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setDrafts((prev) => ({ ...prev, [taskId]: "" }));
      }
    } finally {
      setSending((prev) => ({ ...prev, [taskId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="h-8 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading replies…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {helpTasks.map((ht) => {
        const taskReplies = replies.filter((r) => r.taskId === ht.taskId);
        const isOpen = openTask === ht.taskId;
        return (
          <div key={ht.taskId} className="border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenTask(isOpen ? null : ht.taskId)}
              className="w-full flex items-center gap-2.5 px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-900">{ht.taskTitle}</p>
                <p className="text-xs text-amber-700 mt-0.5 truncate">"{ht.message}"</p>
              </div>
              {taskReplies.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium shrink-0">
                  <MessageSquare className="w-3 h-3" /> {taskReplies.length}
                </span>
              )}
            </button>
            {isOpen && (
              <div className="p-4 bg-white space-y-3">
                {/* Existing replies */}
                {taskReplies.length > 0 && (
                  <div className="space-y-2">
                    {taskReplies.map((r) => (
                      <div key={r.id} className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-indigo-700">You replied</span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleString("en-US", {
                              month: "short", day: "numeric",
                              hour: "numeric", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{r.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Reply form */}
                <div>
                  <textarea
                    value={drafts[ht.taskId] ?? ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [ht.taskId]: e.target.value }))}
                    placeholder="Write a reply to help the employee…"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 placeholder-gray-300"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => sendReply(ht.taskId, ht.taskTitle)}
                      disabled={sending[ht.taskId] || !(drafts[ht.taskId]?.trim())}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {sending[ht.taskId] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      {sending[ht.taskId] ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
