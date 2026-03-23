"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MessageSquare, Send, ChevronDown, ChevronRight, Loader2, Inbox, CheckCircle2 } from "lucide-react";

interface Reply {
  id: string;
  message: string;
  createdAt: string;
}

interface HelpItem {
  assignmentId: string;
  taskId: string;
  employeeId: string;
  employeeName: string;
  planTitle: string;
  taskTitle: string;
  message: string;
  requestedAt: string;
  replies: Reply[];
}

const avatarColors = [
  "from-indigo-500 to-indigo-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-blue-500 to-blue-600",
];

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

function HelpCard({ item, idx, onReplied }: { item: HelpItem; idx: number; onReplied: (assignmentId: string, taskId: string, reply: Reply) => void }) {
  const [open, setOpen] = useState(item.replies.length === 0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials = item.employeeName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const grad = avatarColors[idx % avatarColors.length];
  const replied = item.replies.length > 0;

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/assignments/${item.assignmentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: item.taskId, message: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      onReplied(item.assignmentId, item.taskId, {
        id: data.id,
        message: text.trim(),
        createdAt: new Date().toISOString(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${replied ? "border-slate-200/80" : "border-indigo-200"}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} text-white text-xs font-bold flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{item.employeeName}</span>
            {!replied && (
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full">Needs reply</span>
            )}
            {replied && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Replied
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            <span className="text-slate-500 font-medium">{item.taskTitle}</span>
            {" · "}
            {item.planTitle}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-400">{timeAgo(item.requestedAt)}</p>
          {open
            ? <ChevronDown className="w-4 h-4 text-slate-300 mt-1 ml-auto" />
            : <ChevronRight className="w-4 h-4 text-slate-300 mt-1 ml-auto" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3 space-y-3">
          {/* Employee's message */}
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Help request</p>
            <p className="text-sm text-gray-700">{item.message}</p>
          </div>

          {/* Existing replies */}
          {item.replies.length > 0 && (
            <div className="space-y-2">
              {item.replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
                    M
                  </div>
                  <div className="flex-1 bg-indigo-50 rounded-xl px-3.5 py-2.5">
                    <p className="text-sm text-gray-800">{reply.message}</p>
                    <p className="text-[10px] text-indigo-400 mt-1">{timeAgo(reply.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          <form onSubmit={sendReply} className="flex items-end gap-2 pt-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              className="flex-1 resize-none text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(e as any);
              }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Reply
            </button>
          </form>

          <Link
            href={`/employees/${item.employeeId}`}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View employee profile <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function InboxView() {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleReplied(assignmentId: string, taskId: string, reply: Reply) {
    setItems((prev) =>
      prev.map((item) =>
        item.assignmentId === assignmentId && item.taskId === taskId
          ? { ...item, replies: [...item.replies, reply] }
          : item
      )
    );
  }

  const filtered = items.filter((item) => {
    if (filter === "pending") return item.replies.length === 0;
    if (filter === "replied") return item.replies.length > 0;
    return true;
  });

  const pendingCount = items.filter((i) => i.replies.length === 0).length;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200/80 p-1 w-fit shadow-sm">
        {(["all", "pending", "replied"] as const).map((f) => {
          const label = f === "all" ? `All (${items.length})` : f === "pending" ? `Pending (${pendingCount})` : `Replied (${items.length - pendingCount})`;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-gray-700 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80">
          <Inbox className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {filter === "pending" ? "No pending requests" : filter === "replied" ? "No replied requests" : "Your inbox is empty"}
          </p>
          <p className="text-xs text-slate-300 mt-1">Help requests from employees will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <HelpCard
              key={`${item.assignmentId}:${item.taskId}`}
              item={item}
              idx={idx}
              onReplied={handleReplied}
            />
          ))}
        </div>
      )}
    </div>
  );
}
