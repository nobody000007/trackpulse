"use client";
import { useCallback } from "react";
import { api } from "@/frontend/lib/api-client";
import type { TrackingEventInput, UpdateTaskProgressInput } from "@/shared/types/api";

export function useTracking(token: string) {
  const sendEvent = useCallback(
    async (event: TrackingEventInput) => {
      try {
        await api.track.sendEvent(token, event);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[tracking] sendEvent failed:", err);
      }
    },
    [token]
  );

  const updateProgress = useCallback(
    async (taskId: string, data: UpdateTaskProgressInput) => {
      return api.track.updateTaskProgress(token, taskId, data);
    },
    [token]
  );

  return { sendEvent, updateProgress };
}
