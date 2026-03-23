import { PlanDetail } from "@/frontend/components/plans/plan-detail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PlanDetailPageProps {
  params: { id: string };
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  return (
    <div className="space-y-4 max-w-5xl">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </Link>
      <PlanDetail planId={params.id} />
    </div>
  );
}
