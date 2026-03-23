"use client";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface DaySeries {
  day: string;
  employee: number;
  teamAvg: number;
}

export function VelocityChart({ assignmentId, planId }: { assignmentId: string; planId: string }) {
  const [series, setSeries] = useState<DaySeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats/velocity?assignmentId=${assignmentId}&planId=${planId}`)
      .then((r) => r.json())
      .then((d) => { setSeries(d.series ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [assignmentId, planId]);

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxVal = Math.max(...series.flatMap((d) => [d.employee, d.teamAvg]), 1);
  const recent = series.slice(-14); // show last 14 days for readability

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-400 inline-block" /> This employee
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-gray-200 inline-block" /> Team avg
        </span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {recent.map((d) => {
          const empH = Math.round((d.employee / maxVal) * 80);
          const avgH = Math.round((d.teamAvg / maxVal) * 80);
          const label = new Date(d.day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${label}: ${d.employee} tasks (team avg ${d.teamAvg})`}>
              <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: 80 }}>
                {/* Team avg bar (behind) */}
                <div
                  className="flex-1 bg-gray-200 rounded-t-sm transition-all"
                  style={{ height: avgH || 2 }}
                />
                {/* Employee bar */}
                <div
                  className={`flex-1 rounded-t-sm transition-all ${d.employee > d.teamAvg ? "bg-emerald-400" : d.employee > 0 ? "bg-indigo-400" : "bg-gray-100"}`}
                  style={{ height: empH || 2 }}
                />
              </div>
              {/* Day label — every 3rd */}
              {recent.indexOf(d) % 3 === 0 && (
                <span className="text-[9px] text-gray-400 whitespace-nowrap">
                  {new Date(d.day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {series.every((d) => d.employee === 0) && (
        <p className="text-xs text-gray-400 text-center">No completions in the last 21 days</p>
      )}
    </div>
  );
}
