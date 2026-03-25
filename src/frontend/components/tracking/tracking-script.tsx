"use client";
import { useEffect, useRef } from "react";
import { useTracking } from "@/frontend/hooks/use-tracking";

interface TrackingScriptProps {
  token: string;
  taskId?: string;
}

export function TrackingScript({ token, taskId }: TrackingScriptProps) {
  const { sendEvent } = useTracking(token);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const readStartTime = useRef<number>(Date.now());
  const cumulativeReadTime = useRef(0);
  const isVisible = useRef(true);

  useEffect(() => {
    if (!taskId) return;

    // Fire OPEN event
    sendEvent({ taskId: taskId!, eventType: "OPEN", sessionId: sessionId.current });

    // Track visibility
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        isVisible.current = false;
        cumulativeReadTime.current += Math.round((Date.now() - readStartTime.current) / 1000);
      } else {
        isVisible.current = true;
        readStartTime.current = Date.now();
      }
    }

    // Heartbeat every 30s
    const heartbeatInterval = setInterval(() => {
      if (!isVisible.current) return;
      const elapsed = Math.round((Date.now() - readStartTime.current) / 1000);
      const totalTime = cumulativeReadTime.current + elapsed;
      sendEvent({ taskId: taskId!, eventType: "HEARTBEAT", sessionId: sessionId.current, readTimeSec: totalTime });
    }, 30000);

    // Scroll tracking
    let maxScroll = 0;
    function handleScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.body.scrollHeight;
      const depth = Math.round((scrolled / total) * 100);
      if (depth > maxScroll) {
        maxScroll = depth;
        sendEvent({ taskId: taskId!, eventType: "SCROLL", sessionId: sessionId.current, scrollDepthPct: depth });
      }
    }

    // Close event
    function handleBeforeUnload() {
      const elapsed = Math.round((Date.now() - readStartTime.current) / 1000);
      const totalTime = cumulativeReadTime.current + elapsed;
      sendEvent({ taskId: taskId!, eventType: "CLOSE", sessionId: sessionId.current, readTimeSec: totalTime });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [taskId, sendEvent]);

  return null;
}
