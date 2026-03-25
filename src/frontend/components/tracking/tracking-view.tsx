"use client";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronRight, CheckCircle2, Circle, Loader2,
  ExternalLink, FileText, Zap, Video, Clock, Flag, Send, X,
  Paperclip, MessageSquare, Calendar, AlertTriangle, Download,
  Image, Film, Archive,
} from "lucide-react";
import { useTracking } from "@/frontend/hooks/use-tracking";
import { LinkTimerWidget } from "./link-timer-widget";
import { InlineDocument } from "./inline-document";
import type { ProgressStatus } from "@/shared/types/enums";

interface Attachment {
  id: string;
  filename: string;
  blobUrl: string;
  fileType: string;
  fileSize: number;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  priority: string;
  url?: string | null;
  content?: string | null;
  dueDate?: string | null;
  attachments?: Attachment[];
}

interface Phase {
  id: string;
  title: string;
  description?: string | null;
  tasks: Task[];
}

interface Progress {
  taskId: string;
  status: ProgressStatus;
  submissionUrl?: string | null;
  submissionName?: string | null;
}

interface Reply {
  id: string;
  taskId: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

interface TrackingViewProps {
  token: string;
  phases: Phase[];
  progress: Progress[];
  linkReadSeconds?: Record<string, number>;
  onProgressChange?: (completedCount: number) => void;
  onReadTimeChange?: (taskId: string, addedSecs: number) => void;
}

function AttachmentIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <Image className="w-3 h-3" />;
  if (type.startsWith("video/")) return <Film className="w-3 h-3" />;
  if (type.includes("zip") || type.includes("rar")) return <Archive className="w-3 h-3" />;
  return <FileText className="w-3 h-3" />;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ACTION:   { label: "Action",   cls: "bg-blue-50 text-blue-600 border-blue-100",      icon: <Zap className="w-3 h-3" /> },
    DOCUMENT: { label: "Document", cls: "bg-purple-50 text-purple-600 border-purple-100", icon: <FileText className="w-3 h-3" /> },
    VIDEO:    { label: "Video",    cls: "bg-rose-50 text-rose-600 border-rose-100",       icon: <Video className="w-3 h-3" /> },
    LINK:     { label: "Link",     cls: "bg-cyan-50 text-cyan-600 border-cyan-100",       icon: <ExternalLink className="w-3 h-3" /> },
  };
  const { label, cls, icon } = map[type] ?? { label: type, cls: "bg-gray-50 text-gray-500 border-gray-100", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {icon}{label}
    </span>
  );
}

function TaskRow({
  token, task, initialStatus, initialLinkReadSec,
  initialSubmissionUrl, initialSubmissionName, replies,
  onStatusChange, onMarkReplyRead, onReadTimeChange,
}: {
  token: string;
  task: Task;
  initialStatus: ProgressStatus;
  initialLinkReadSec: number;
  initialSubmissionUrl?: string | null;
  initialSubmissionName?: string | null;
  replies: Reply[];
  onStatusChange: (taskId: string, status: ProgressStatus) => void;
  onMarkReplyRead: (replyId: string) => void;
  onReadTimeChange?: (taskId: string, addedSecs: number) => void;
}) {
  const { updateProgress, sendEvent } = useTracking(token);
  const [status, setStatus] = useState<ProgressStatus>(initialStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [totalReadSec, setTotalReadSec] = useState(initialLinkReadSec);
  const [readJustUpdated, setReadJustUpdated] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [helpSending, setHelpSending] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [subUrl, setSubUrl] = useState(initialSubmissionUrl ?? "");
  const [subName, setSubName] = useState(initialSubmissionName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!(initialSubmissionUrl || initialSubmissionName));
  const [subFiles, setSubFiles] = useState<{ id: string; filename: string; blobUrl: string; fileType: string; fileSize: number }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openedRef = useRef(false);

  function fireOpen() {
    if (!openedRef.current) {
      openedRef.current = true;
      sendEvent({ taskId: task.id, eventType: "OPEN" });
    }
  }

  async function handleStatus(next: ProgressStatus | string) {
    fireOpen();
    setUpdatingStatus(true);
    setStatus(next);
    onStatusChange(task.id, next);
    await updateProgress(task.id, { status: next });
    setUpdatingStatus(false);
  }

  function handleTimerClose(secs: number) {
    setTimerOpen(false);
    if (secs > 0) {
      setTotalReadSec((prev) => prev + secs);
      onReadTimeChange?.(task.id, secs);
      setReadJustUpdated(true);
      setTimeout(() => setReadJustUpdated(false), 2000);
    }
  }

  async function sendHelp() {
    if (!helpMessage.trim()) return;
    setHelpSending(true);
    try {
      await fetch(`/api/track/${token}/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, taskTitle: task.title, message: helpMessage.trim() }),
      });
      setHelpSent(true);
      setHelpOpen(false);
      setHelpMessage("");
    } finally {
      setHelpSending(false);
    }
  }

  async function uploadSubFile(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > 20 * 1024 * 1024) { setFileError("File must be under 20 MB."); return; }
    setUploadingFile(true); setFileError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/track/${token}/submit/${task.id}/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const f = await res.json();
      setSubFiles((prev) => [...prev, f]);
    } catch (e: any) { setFileError(e.message); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function removeSubFile(id: string) {
    await fetch(`/api/track/${token}/submit/${task.id}/upload`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: id }),
    });
    setSubFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function submitWork() {
    if (!subUrl.trim() && !subName.trim() && subFiles.length === 0) return;
    setSubmitting(true);
    try {
      await fetch(`/api/track/${token}/submit/${task.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionUrl: subUrl.trim() || null, submissionName: subName.trim() || null }),
      });
      setSubmitted(true);
      setSubmitOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const isDone = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";
  const unreadReplies = replies.filter((r) => !r.readAt);
  const attachments = task.attachments ?? [];

  return (
    <>
      {timerOpen && task.url && (
        <LinkTimerWidget
          token={token} taskId={task.id} taskTitle={task.title}
          url={task.url} onClose={handleTimerClose}
        />
      )}

      <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDone
          ? "border-emerald-200 bg-emerald-50/30"
          : isInProgress
          ? "border-indigo-200 bg-indigo-50/20"
          : "border-gray-200 bg-white"
      }`} onClick={fireOpen}>

        {/* Status stripe */}
        <div className={`h-0.5 w-full ${isDone ? "bg-emerald-400" : isInProgress ? "bg-indigo-400" : "bg-transparent"}`} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); handleStatus(isDone ? "NOT_STARTED" : "COMPLETED"); }}
              className="mt-0.5 shrink-0 focus:outline-none"
            >
              {updatingStatus
                ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                : isDone
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <Circle className={`w-5 h-5 transition-colors ${isInProgress ? "text-indigo-400" : "text-gray-300 hover:text-gray-400"}`} />
              }
            </button>

            <div className="flex-1 min-w-0">
              {/* Title + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`font-semibold text-sm leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {task.title}
                </span>
                <TypeBadge type={task.type} />
                {task.priority === "HIGH" && !isDone && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-rose-50 text-rose-600 border border-rose-100 font-medium">
                    High priority
                  </span>
                )}
                {task.dueDate && !isDone && (() => {
                  const days = Math.ceil((new Date(task.dueDate!).getTime() - Date.now()) / 86400000);
                  const overdue = days < 0;
                  return (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border font-medium ${
                      overdue ? "bg-red-50 text-red-600 border-red-100"
                      : days <= 2 ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}>
                      {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                    </span>
                  );
                })()}
                {isInProgress && !isDone && (
                  <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    In progress
                  </span>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{task.description}</p>
              )}

              {/* Inline document */}
              {task.content && (
                <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                  <InlineDocument token={token} taskId={task.id} content={task.content} />
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors group"
                    >
                      <AttachmentIcon type={att.fileType} />
                      <span className="max-w-[140px] truncate">{att.filename}</span>
                      <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {/* Resource link + read time */}
              {task.url && (
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); fireOpen(); setTimerOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Resource
                  </button>
                  {totalReadSec > 0 && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium transition-all ${
                      readJustUpdated ? "text-emerald-600 scale-105" : "text-slate-500"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {totalReadSec >= 60 ? `${Math.round(totalReadSec / 60)}m` : `${totalReadSec}s`} read
                      {readJustUpdated && <span className="text-emerald-500">✓</span>}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {!isDone && status !== "IN_PROGRESS" && (
                  <button
                    onClick={() => handleStatus("IN_PROGRESS")}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                  >
                    Start
                  </button>
                )}
                {!isDone && (
                  <button
                    onClick={() => handleStatus("COMPLETED")}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-medium transition-colors"
                  >
                    Mark complete
                  </button>
                )}
                {isDone && (
                  <button
                    onClick={() => handleStatus("NOT_STARTED")}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Undo
                  </button>
                )}

                <div className="flex-1" />

                {!helpSent ? (
                  <button
                    onClick={() => { setHelpOpen((v) => !v); setSubmitOpen(false); }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 font-medium transition-colors"
                  >
                    <Flag className="w-3 h-3" /> Need help
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium px-2.5 py-1.5">
                    <Flag className="w-3 h-3" /> Help requested
                    <button onClick={() => setHelpSent(false)} className="ml-1 text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={() => { setSubmitOpen((v) => !v); setHelpOpen(false); }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                    submitted
                      ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Paperclip className="w-3 h-3" />
                  {submitted ? "Submitted" : "Submit work"}
                </button>

                {replies.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 px-2.5 py-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {unreadReplies.length > 0 ? `${unreadReplies.length} new` : `${replies.length} reply`}
                  </span>
                )}
              </div>

              {/* Help form */}
              {helpOpen && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2">What are you stuck on?</p>
                  <textarea
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Describe the problem — your manager will be notified…"
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-700 placeholder-gray-400"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setHelpOpen(false); setHelpMessage(""); }}
                      className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                    <button onClick={sendHelp} disabled={helpSending || !helpMessage.trim()}
                      className="flex items-center gap-1.5 text-xs text-white bg-amber-600 hover:bg-amber-700 font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                      {helpSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      {helpSending ? "Sending…" : "Notify manager"}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit form */}
              {submitOpen && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-700">Submit your work</p>
                  <input type="url" value={subUrl} onChange={(e) => setSubUrl(e.target.value)}
                    placeholder="Link to your work (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700 placeholder-gray-400"
                  />
                  <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)}
                    placeholder="Describe what you completed…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700 placeholder-gray-400"
                  />

                  {/* File upload */}
                  <div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => uploadSubFile(e.target.files)} />
                    {subFiles.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {subFiles.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="flex-1 truncate text-gray-700">{f.filename}</span>
                            <button onClick={() => removeSubFile(f.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {fileError && <p className="text-xs text-red-600 mb-1">{fileError}</p>}
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors disabled:opacity-50">
                      {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                      {uploadingFile ? "Uploading…" : "Attach a file"}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setSubmitOpen(false)}
                      className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                    <button onClick={submitWork} disabled={submitting || (!subUrl.trim() && !subName.trim() && subFiles.length === 0)}
                      className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                      {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </div>
              )}

              {/* Manager replies */}
              {replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      onClick={() => { if (!reply.readAt) onMarkReplyRead(reply.id); }}
                      className={`rounded-xl p-3 text-xs cursor-pointer transition-colors ${
                        !reply.readAt ? "bg-indigo-50 border border-indigo-200" : "bg-gray-50 border border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">M</div>
                        <span className="font-semibold text-gray-700">Manager replied</span>
                        {!reply.readAt && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        <span className="ml-auto text-gray-400">
                          {new Date(reply.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PhaseSection({
  token, phase, progressMap, submissionMap, linkReadSeconds,
  repliesByTask, defaultOpen, onStatusChange, onMarkReplyRead, onReadTimeChange,
}: {
  token: string;
  phase: Phase;
  progressMap: Map<string, ProgressStatus>;
  submissionMap: Map<string, { submissionUrl?: string | null; submissionName?: string | null }>;
  linkReadSeconds: Record<string, number>;
  repliesByTask: Map<string, Reply[]>;
  defaultOpen: boolean;
  onStatusChange: (taskId: string, status: ProgressStatus) => void;
  onMarkReplyRead: (replyId: string) => void;
  onReadTimeChange?: (taskId: string, addedSecs: number) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const total = phase.tasks.length;
  const done = phase.tasks.filter((t) => progressMap.get(t.id) === "COMPLETED").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
      allDone ? "border-emerald-200 bg-emerald-50/20" : "border-gray-200 bg-white"
    }`}>
      {/* Phase header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-4 px-6 py-5 transition-colors text-left ${
          allDone ? "hover:bg-emerald-50/40" : "hover:bg-gray-50/80"
        }`}
      >
        {/* Phase number / check */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
          allDone
            ? "bg-emerald-100 text-emerald-600"
            : "bg-indigo-50 text-indigo-600"
        }`}>
          {allDone ? <CheckCircle2 className="w-4 h-4" /> : <span>{phase.title.match(/\d+/)?.[0] ?? "·"}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`font-bold text-base ${allDone ? "text-emerald-700" : "text-gray-900"}`}>
              {phase.title}
            </span>
            {allDone && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" /> Complete
              </span>
            )}
          </div>
          {phase.description && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{phase.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-400" : "bg-indigo-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-500 w-12 text-right">{done}/{total} done</span>
          </div>
          <span className={`shrink-0 ${allDone ? "text-emerald-400" : "text-gray-300"}`}>
            {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-5">
          {phase.tasks.map((task) => (
            <TaskRow
              key={task.id}
              token={token}
              task={task}
              initialStatus={progressMap.get(task.id) ?? "NOT_STARTED"}
              initialLinkReadSec={linkReadSeconds[task.id] ?? 0}
              initialSubmissionUrl={submissionMap.get(task.id)?.submissionUrl}
              initialSubmissionName={submissionMap.get(task.id)?.submissionName}
              replies={repliesByTask.get(task.id) ?? []}
              onStatusChange={onStatusChange}
              onMarkReplyRead={onMarkReplyRead}
              onReadTimeChange={onReadTimeChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TrackingView({ token, phases, progress, linkReadSeconds = {}, onProgressChange, onReadTimeChange }: TrackingViewProps) {
  const allTaskIds = phases.flatMap((p) => p.tasks.map((t) => t.id));

  const [progressMap, setProgressMap] = useState<Map<string, ProgressStatus>>(() => {
    const m = new Map<string, ProgressStatus>();
    progress.forEach((p) => m.set(p.taskId, p.status));
    return m;
  });

  const [replies, setReplies] = useState<Reply[]>([]);

  useEffect(() => {
    fetch(`/api/track/${token}/replies`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReplies(data); })
      .catch(() => {});
  }, [token]);

  async function markReplyRead(replyId: string) {
    await fetch(`/api/track/${token}/replies`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyId }),
    });
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, readAt: new Date().toISOString() } : r));
  }

  const submissionMap = new Map<string, { submissionUrl?: string | null; submissionName?: string | null }>();
  progress.forEach((p) => {
    if (p.submissionUrl || p.submissionName)
      submissionMap.set(p.taskId, { submissionUrl: p.submissionUrl, submissionName: p.submissionName });
  });

  const repliesByTask = new Map<string, Reply[]>();
  for (const r of replies) {
    if (!repliesByTask.has(r.taskId)) repliesByTask.set(r.taskId, []);
    repliesByTask.get(r.taskId)!.push(r);
  }

  function handleStatusChange(taskId: string, status: ProgressStatus) {
    setProgressMap((prev) => {
      const next = new Map(prev).set(taskId, status);
      if (onProgressChange) {
        const completed = allTaskIds.filter((id) => next.get(id) === "COMPLETED").length;
        onProgressChange(completed);
      }
      return next;
    });
  }

  const firstIncompleteIdx = phases.findIndex((ph) =>
    ph.tasks.some((t) => progressMap.get(t.id) !== "COMPLETED")
  );

  if (phases.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No phases in this plan yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {phases.map((phase, idx) => (
        <PhaseSection
          key={phase.id}
          token={token}
          phase={phase}
          progressMap={progressMap}
          submissionMap={submissionMap}
          linkReadSeconds={linkReadSeconds}
          repliesByTask={repliesByTask}
          defaultOpen={idx === firstIncompleteIdx || firstIncompleteIdx === -1}
          onStatusChange={handleStatusChange}
          onMarkReplyRead={markReplyRead}
          onReadTimeChange={onReadTimeChange}
        />
      ))}
    </div>
  );
}
