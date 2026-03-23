import Link from "next/link";
import { PlanList } from "@/frontend/components/plans/plan-list";
import { Plus } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Plans</h1>
          <p className="text-gray-500 text-sm mt-1">AI-generated plans for your team.</p>
        </div>
        <Link
          href="/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Plan
        </Link>
      </div>
      <PlanList />
    </div>
  );
}
