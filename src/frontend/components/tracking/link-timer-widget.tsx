"use client";
import { useState, useEffect, useRef } from "react";
import { ExternalLink, CheckCircle2, X, Clock, ArrowLeft } from "lucide-react";
import { useTracking } from "@/frontend/hooks/use-tracking";

interface LinkTimerWidgetProps {
  token: string;
  taskId: string;
  taskTitle: string;
  url: string;
  onClose: (readTimeSec: number) => void;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function LinkTimerWidget({ token, taskId, taskTitle, url, onClose }: LinkTimerWidgetProps) {
  const { sendEvent } = useTracking(token);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [returned, setReturned] = useState(false);
  const startRef = useRef(Date.now());
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);

    // Detect when employee comes back to this tab after clicking the link and reading the contentt
    function onVisible() {
      if (document.visibilityState === "visible") setReturned(true);
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function handleDone() {
    const secs = Math.round((Date.now() - startRef.current) / 1000);
    setDone(true);
    sendEvent({ taskId, eventType: "LINK_RETURN", readTimeSec: secs });
    setTimeout(() => onClose(secs), 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onClose(0)} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Color strip */}
      <div className={`h-1 w-full ${done ? "bg-emerald-500" : "bg-indigo-500"}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Reading timer</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{taskTitle}</p>
          </div>
          <button
            onClick={() => onClose(0)}
            className="text-gray-300 hover:text-gray-500 transition-colors ml-2 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timer */}
        <div className={`flex items-center justify-center py-3 rounded-xl mb-3 ${done ? "bg-emerald-50" : "bg-indigo-50"}`}>
          {done ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              {fmt(elapsed)} logged!
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${returned ? "text-indigo-500" : "text-gray-400"}`} />
              <span className="text-2xl font-mono font-bold text-indigo-600 tabular-nums">{fmt(elapsed)}</span>
            </div>
          )}
        </div>

        {/* Returned hint */}
        {returned && !done && (
          <p className="text-xs text-emerald-600 font-medium text-center mb-3">
            Welcome back! Click Done when you're finished.
          </p>
        )}

        {!done && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 mb-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open {hostname}
            </a>
            <button
              onClick={handleDone}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Done reading — {fmt(elapsed)}
            </button>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
