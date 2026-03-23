"use client";
import { useState } from "react";
import { User, Mail, Briefcase, Star, AlertTriangle, Loader2, CheckCircle2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { CreateEmployeeInput } from "@/shared/types/api";

interface EmployeeFormProps {
  onSuccess?: () => void;
  createEmployee?: (data: CreateEmployeeInput) => Promise<unknown>;
}

export function EmployeeForm({ onSuccess, createEmployee: createEmployeeProp }: EmployeeFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data: CreateEmployeeInput = {
        name,
        email,
        role: role || undefined,
        strengths: strengths || undefined,
        weaknesses: weaknesses || undefined,
      };
      if (createEmployeeProp) {
        await createEmployeeProp(data);
      } else {
        const { useEmployees: _hook } = await import("@/frontend/hooks/use-employees");
        throw new Error("No createEmployee provided");
      }
      setName(""); setEmail(""); setRole(""); setStrengths(""); setWeaknesses("");
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message ?? "Failed to add employee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Plus className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Add New Employee</p>
            <p className="text-xs text-gray-400">Click to expand</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4 space-y-4">
            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Employee added!
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="Jane Smith"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="jane@company.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Role / Position</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Frontend Developer, Sales Rep"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" /> AI Profile
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Strengths
                  </label>
                  <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2}
                    placeholder="Quick learner, strong communicator…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Areas to Improve
                  </label>
                  <textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={2}
                    placeholder="Technical writing, Salesforce…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : "Add Employee"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
