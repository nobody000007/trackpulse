"use client";

interface EmployeeProgress {
  employeeName: string;
  completionRate: number;
  riskLevel: string;
}

interface ComparativeChartProps {
  employees: EmployeeProgress[];
}

export function ComparativeChart({ employees }: ComparativeChartProps) {
  return (
    <div className="space-y-3">
      {employees.map((emp) => (
        <div key={emp.employeeName} className="flex items-center gap-3">
          <span className="text-sm text-gray-700 w-32 truncate">{emp.employeeName}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                emp.riskLevel === "RED" ? "bg-red-500" : emp.riskLevel === "YELLOW" ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${emp.completionRate}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 w-12 text-right">{emp.completionRate}%</span>
        </div>
      ))}
    </div>
  );
}
