"use client";
import { useState } from "react";
import { api } from "@/frontend/lib/api-client";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePulseReport(assignmentId: string) {
    setLoading(true);
    setError(null);
    try {
      return await api.ai.pulseReport(assignmentId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function generateNudge(assignmentId: string, send = false) {
    setLoading(true);
    setError(null);
    try {
      return await api.ai.nudge(assignmentId, send);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, generatePulseReport, generateNudge };
}
