"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, CheckCircle2, TrendingUp,
  AlertTriangle, Loader2, ExternalLink, RotateCcw,
} from "lucide-react";
import { useTracking } from "@/frontend/hooks/use-tracking";

interface ResourceReaderProps {
  token: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string | null;
  url: string;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ResourceReader({ token, taskId, taskTitle, taskDescription, url }: ResourceReaderProps) {
  const router = useRouter();
  const { sendEvent } = useTracking(token);

  const [currentUrl, setCurrentUrl] = useState(url);
  const [iframeKey, setIframeKey] = useState(0); // force re-mount on navigate
  const [pageTitle, setPageTitle] = useState(taskTitle);
  const [loading, setLoading] = useState(true);
  const [proxyFailed, setProxyFailed] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();

  // Start timer + fire OPEN event
  useEffect(() => {
    sendEvent({ taskId, eventType: "OPEN" });
    intervalRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);

    function handleUnload() {
      const secs = Math.round((Date.now() - startRef.current) / 1000);
      sendEvent({ taskId, eventType: "LINK_RETURN", readTimeSec: secs });
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Listen for messages from the proxied iframe
  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === "proxy-navigate" && e.data.url) {
      setCurrentUrl(e.data.url);
      setIframeKey((k) => k + 1);
      setLoading(true);
    }
    if (e.data?.type === "proxy-loaded" && e.data.title) {
      setPageTitle(e.data.title);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  function handleDone() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const secs = Math.round((Date.now() - startRef.current) / 1000);
    setDone(true);
    sendEvent({ taskId, eventType: "LINK_RETURN", readTimeSec: secs });
    setTimeout(() => router.back(), 700);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* ── Top bar ── */}
      <div className="h-12 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-sm font-medium text-gray-800 truncate">{pageTitle}</span>
        </div>

        {/* Reload button */}
        <button
          onClick={() => { setLoading(true); setIframeKey((k) => k + 1); }}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title="Reload"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Open in new tab */}
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{hostname}</span>
        </a>

        <div className="w-px h-5 bg-gray-200" />

        {/* Live timer */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-sm font-mono font-bold text-gray-700 tabular-nums">{fmt(elapsed)}</span>
        </div>

        {/* Done button */}
        {done ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg shrink-0">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </div>
        ) : (
          <button
            onClick={handleDone}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" /> Done reading
          </button>
        )}
      </div>

      {/* ── Loading bar ── */}
      {loading && (
        <div className="h-0.5 bg-gray-100 shrink-0">
          <div className="h-full bg-indigo-500 animate-pulse w-2/3 rounded-full" />
        </div>
      )}

      {/* ── Proxy iframe ── */}
      {!proxyFailed && (
        <iframe
          key={iframeKey}
          src={proxyUrl}
          className="flex-1 w-full border-0"
          title={taskTitle}
          onLoad={() => setLoading(false)}
          onError={() => { setProxyFailed(true); setLoading(false); }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}

      {/* ── Fallback if proxy errors ── */}
      {proxyFailed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50 text-center px-6">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <div>
            <p className="font-semibold text-gray-800 mb-1">Couldn't load this page</p>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              The site may require a login or block external access.
              Open it in a new tab — your timer is still running.
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open on {hostname}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
