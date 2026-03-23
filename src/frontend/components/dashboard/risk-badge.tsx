interface RiskBadgeProps {
  level: "GREEN" | "YELLOW" | "RED";
}

const styles = {
  GREEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  YELLOW: "bg-amber-50 text-amber-700 border-amber-200",
  RED: "bg-red-50 text-red-700 border-red-200",
};

const dots = {
  GREEN: "bg-emerald-500",
  YELLOW: "bg-amber-500",
  RED: "bg-red-500",
};

const labels = {
  GREEN: "On Track",
  YELLOW: "At Risk",
  RED: "Overdue",
};

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[level]}`} />
      {labels[level]}
    </span>
  );
}
