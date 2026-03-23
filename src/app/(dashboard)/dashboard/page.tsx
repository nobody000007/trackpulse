import { StatsOverview } from "@/frontend/components/dashboard/stats-overview";
import { EmployeeList } from "@/frontend/components/dashboard/employee-list";
import { TeamActivity } from "@/frontend/components/dashboard/team-activity";
import { auth } from "@/backend/lib/auth";
import Link from "next/link";
import { UserPlus, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">{dateStr}</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here's your team's training overview.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/employees"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-sm font-medium text-gray-700 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </Link>
          <Link
            href="/plans/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Plan
          </Link>
        </div>
      </div>

      <StatsOverview />

      <div className="flex gap-5 flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-auto">
          <EmployeeList />
        </div>
        <div className="w-72 shrink-0 overflow-auto">
          <TeamActivity />
        </div>
      </div>
    </div>
  );
}
