"use client";
import { useState } from "react";
import { api } from "@/frontend/lib/api-client";

interface AssignmentDialogProps {
  employeeId: string;
  employeeName: string;
  plans: Array<{ id: string; title: string }>;
  onAssigned?: () => void;
}

export function AssignmentDialog({ employeeId, employeeName, plans, onAssigned }: AssignmentDialogProps) {
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleAssign() {
    if (!planId) return;
    setLoading(true);
    try {
      await api.assignments.create({ planId, employeeId });
      setOpen(false);
      onAssigned?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-indigo-600 hover:underline"
      >
        Assign Plan
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h3 className="text-lg font-semibold">Assign Plan to {employeeName}</h3>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a plan...</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.title}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading || !planId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
