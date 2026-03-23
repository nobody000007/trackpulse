import { PlanBuilder } from "@/frontend/components/plans/plan-builder";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPlanPage() {
  return (
    <div className="space-y-4">
      <Link href="/plans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Training Plan</h1>
        <p className="text-gray-500 text-sm mt-1">Let AI generate a complete plan, or build it manually.</p>
      </div>
      <PlanBuilder />
    </div>
  );
}
