interface EngagementStatsProps {
  openCount: number;
  totalReadTimeSec: number;
  maxScrollDepthPct: number;
  lastActivity?: Date;
}

export function EngagementStats({
  openCount,
  totalReadTimeSec,
  maxScrollDepthPct,
  lastActivity,
}: EngagementStatsProps) {
  const readTimeMin = Math.round(totalReadTimeSec / 60);

  return (
    <div className="flex gap-4 text-sm text-gray-600">
      <span>{openCount} opens</span>
      <span>{readTimeMin}m read time</span>
      <span>{Math.round(maxScrollDepthPct)}% scrolled</span>
      {lastActivity && <span>Last: {new Date(lastActivity).toLocaleDateString()}</span>}
    </div>
  );
}
