import { AnalyticsView } from "@/frontend/components/analytics/analytics-view";

export const dynamic = "force-dynamic";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <BarChart2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-400 text-sm">Training performance across your team.</p>
        </div>
      </div>
      <AnalyticsView />
    </div>
  );
}
