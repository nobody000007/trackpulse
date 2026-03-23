"use client";
import { useState, useEffect } from "react";
import { api } from "@/frontend/lib/api-client";
import type { DashboardData } from "@/shared/types/api";

export function useDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fetchStats() {
    return api.dashboard
      .overview()
      .then(setStats)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    fetchStats().finally(() => setLoading(false));
    const id = setInterval(fetchStats, 20000); // poll every 20s
    return () => clearInterval(id);
  }, []);

  return { stats, loading, error };
}
