"use client";
import { useState } from "react";
import { api } from "@/frontend/lib/api-client";
import type { GeneratedPlan } from "@/shared/types/api";

interface AIGenerateFormProps {
  onGenerated: (plan: GeneratedPlan) => void;
}

export function AIGenerateForm({ onGenerated }: AIGenerateFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const generated = await api.ai.generatePlan(text);
      onGenerated(generated);
    } catch {
      setError("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-indigo-900">Generate with AI</h3>
      <p className="text-xs text-indigo-700">Paste a job description, syllabus, or role requirements and we&apos;ll create a plan.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Paste job description or training requirements here..."
        className="w-full px-3 py-2 border border-indigo-300 rounded-md text-sm bg-white"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !text.trim()}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Plan with AI"}
      </button>
    </div>
  );
}
