import { EmployeesContainer } from "@/frontend/components/employees/employees-container";

export const dynamic = "force-dynamic";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your team and track training progress.</p>
      </div>
      <EmployeesContainer />
    </div>
  );
}
