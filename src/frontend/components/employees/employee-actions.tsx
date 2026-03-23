"use client";
import { useState } from "react";
import { Copy, CheckCheck, TrendingUp, Trash2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EmployeeActionsProps {
  token: string;
  planId: string;
  assignmentId: string;
}

export function EmployeeActions({ token, planId, assignmentId }: EmployeeActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/track/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function removeAssignment() {
    setRemoving(true);
    try {
      await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRemoving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={copyLink}
        className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        {copied
          ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
          : <><Copy className="w-3.5 h-3.5" /> Copy link</>
        }
      </button>
      <Link
        href={`/plans/${planId}/employee/${assignmentId}`}
        className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" /> Full Stats
      </Link>

      {!confirmOpen ? (
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-red-200 rounded-lg bg-red-50">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-medium">Remove plan?</span>
          <button
            onClick={removeAssignment}
            disabled={removing}
            className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md disabled:opacity-50 transition-colors"
          >
            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
          </button>
          <button
            onClick={() => setConfirmOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
