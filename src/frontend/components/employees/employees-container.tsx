"use client";
import { useEmployees } from "@/frontend/hooks/use-employees";
import { EmployeeForm } from "./employee-form";
import { EmployeeList } from "./employee-list";

export function EmployeesContainer() {
  const { employees, loading, error, createEmployee, deleteEmployee } = useEmployees();

  return (
    <div className="grid grid-cols-2 gap-6 items-start">
      {/* Left: form + tips */}
      <div className="space-y-4">
        <EmployeeForm createEmployee={createEmployee} />
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">Tips for better AI plans</h3>
          <ul className="space-y-2 text-xs text-indigo-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              Add <strong>strengths</strong> so AI emphasises tasks they&apos;ll excel at.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              Add <strong>areas to improve</strong> so AI includes relevant resources.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              Include a <strong>role</strong> for context-aware plan generation.
            </li>
          </ul>
        </div>
      </div>

      {/* Right: live list */}
      <div>
        <EmployeeList employees={employees} loading={loading} error={error} deleteEmployee={deleteEmployee} />
      </div>
    </div>
  );
}
