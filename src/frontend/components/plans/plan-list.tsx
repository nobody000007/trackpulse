"use client";
import Link from "next/link";
import { usePlans } from "@/frontend/hooks/use-plans";
import { PlanCard } from "./plan-card";
import { Plus, BookOpen } from "lucide-react";
import type { Plan } from "@/shared/types/plan";

export function PlanList({ initialPlans }: { initialPlans: Plan[] }) {
  const { plans, error, deletePlan } = usePlans(initialPlans);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        Failed to load plans: {error}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">No plans yet</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-xs">
          Create your first AI-generated training plan and assign it to your team.
        </p>
        <Link
          href="/plans/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create a Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan as any} onDelete={deletePlan} />
      ))}
    </div>
  );
}
