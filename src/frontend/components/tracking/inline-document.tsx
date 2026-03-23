"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle2 } from "lucide-react";
import { useTracking } from "@/frontend/hooks/use-tracking";

interface InlineDocumentProps {
  token: string;
  taskId: string;
  content: string;
}

export function InlineDocument({ token, taskId, content }: InlineDocumentProps) {
  const { sendEvent } = useTracking(token);
  const [expanded, setExpanded] = useState(false);
  const [readSec, setReadSec] = useState(0);
  const [logged, setLogged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number | null>(null);
  const accRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop timer based on visibility and expansion
  useEffect(() => {
    if (!expanded) return;

    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = accRef.current + Math.round((Date.now() - startRef.current!) / 1000);
      setReadSec(elapsed);
    }, 1000);

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        accRef.current += Math.round((Date.now() - startRef.current!) / 1000);
        startRef.current = null;
      } else {
        startRef.current = Date.now();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      // Accumulate time when collapsed
      if (startRef.current) {
        accRef.current += Math.round((Date.now() - startRef.current) / 1000);
        startRef.current = null;
      }
    };
  }, [expanded]);

  function handleMarkRead() {
    const secs = accRef.current + (startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0);
    setLogged(true);
    sendEvent({ taskId, eventType: "CLOSE", readTimeSec: secs });
  }

  function fmt(s: number) {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  // Render content: preserve line breaks, auto-link URLs
  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      // Auto-link URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);
      return (
        <p key={i} className={`${line.trim() === "" ? "h-3" : "mb-1"}`}>
          {parts.map((part, j) =>
            urlRegex.test(part) ? (
              <a key={j} href={part} target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 hover:underline break-all"
              >{part}</a>
            ) : part
          )}
        </p>
      );
    });
  }

  const preview = content.slice(0, 120) + (content.length > 120 ? "…" : "");

  return (
    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex-1 min-w-0">
          {expanded ? (
            <span className="text-xs font-semibold text-gray-600">Document content</span>
          ) : (
            <span className="text-xs text-gray-500 truncate block">{preview}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {readSec > 0 && (
            <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
              <Clock className="w-3 h-3" /> {fmt(readSec)}
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {/* Full content */}
      {expanded && (
        <div ref={containerRef}>
          <div className="px-4 pb-4 text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto border-t border-gray-200 pt-3 font-mono whitespace-pre-wrap">
            {renderContent(content)}
          </div>

          {/* Footer: read time + mark done */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {readSec > 0 ? `${fmt(readSec)} reading` : "Timer started"}
            </div>
            {logged ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logged
              </div>
            ) : (
              <button
                onClick={handleMarkRead}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
