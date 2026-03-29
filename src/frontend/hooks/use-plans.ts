"use client";
import { useState, useEffect } from "react";
import { api } from "@/frontend/lib/api-client";
import type { Plan } from "@/shared/types/plan";
import type { CreatePlanInput } from "@/shared/types/api";

export function usePlans(initialPlans: Plan[] = []) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlans.length > 0) return;
    api.plans
      .list()
      .then((data) => setPlans(data as Plan[]))
      .catch((e) => setError(e.message));
  }, []);

  async function createPlan(data: CreatePlanInput) {
    const plan = await api.plans.create(data);
    setPlans((prev) => [plan as Plan, ...prev]);
    return plan;
  }

  async function deletePlan(id: string) {
    await api.plans.delete(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  return { plans, error, createPlan, deletePlan };
}
