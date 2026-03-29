"use client";
import { useState } from "react";
import { Copy, CheckCheck, TrendingUp, Trash2, Loader2, AlertTriangle, Lock, LockOpen, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EmployeeActionsProps {
  token: string;
  planId: string;
  assignmentId: string;
  hasPassword?: boolean;
}

export function EmployeeActions({ token, planId, assignmentId, hasPassword = false }: EmployeeActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwLocked, setPwLocked] = useState(hasPassword);

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

  async function savePassword() {
    setSavingPw(true);
    try {
      await fetch(`/api/assignments/${assignmentId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setPwLocked(true);
      setLockOpen(false);
      setPassword("");
      router.refresh();
    } finally {
      setSavingPw(false);
    }
  }

  async function removePassword() {
    setSavingPw(true);
    try {
      await fetch(`/api/assignments/${assignmentId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: null }),
      });
      setPwLocked(false);
      setLockOpen(false);
      router.refresh();
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* Password lock button */}
      {!lockOpen ? (
        <button
          onClick={() => setLockOpen(true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-xs transition-colors ${
            pwLocked
              ? "border-amber-200 text-amber-600 bg-amber-50 hover:border-amber-300"
              : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
          }`}
        >
          {pwLocked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
          {pwLocked ? "Locked" : "Lock"}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-amber-200 rounded-lg bg-amber-50">
          {pwLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">Remove password?</span>
              <button
                onClick={removePassword}
                disabled={savingPw}
                className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-2 py-0.5 rounded-md disabled:opacity-50 transition-colors"
              >
                {savingPw ? <Loader2 className="w-3 h-3 animate-spin" /> : "Remove"}
              </button>
              <button onClick={() => setLockOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded-md hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password"
                  className="text-xs border border-amber-200 rounded-md px-2 py-1 pr-6 w-28 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                  onKeyDown={(e) => e.key === "Enter" && password && savePassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <button
                onClick={savePassword}
                disabled={savingPw || !password}
                className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-2 py-0.5 rounded-md disabled:opacity-50 transition-colors"
              >
                {savingPw ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
              </button>
              <button onClick={() => setLockOpen(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded-md hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </>
          )}
        </div>
      )}

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
