"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/frontend/lib/api-client";
import {
  Brain, Plus, Trash2, ChevronDown, ChevronRight,
  Loader2, Sparkles, Save, AlertCircle, CheckCircle2,
  FileText, Link2, Zap, Calendar, ExternalLink
} from "lucide-react";
import type { GeneratedPlan, CreatePlanInput } from "@/shared/types/api";

interface TaskDraft {
  title: string;
  description: string;
  type: string;
  priority: string;
  url: string;
  content: string;
  dueDate: string;
  orderIndex: number;
}

interface PhaseDraft {
  title: string;
  orderIndex: number;
  tasks: TaskDraft[];
  collapsed?: boolean;
}

const TYPE_STYLES: Record<string, string> = {
  ACTION: "bg-blue-50 text-blue-700 border-blue-200",
  DOCUMENT: "bg-purple-50 text-purple-700 border-purple-200",
  LINK: "bg-cyan-50 text-cyan-700 border-cyan-200",
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  ACTION: <Zap className="w-3 h-3" />,
  DOCUMENT: <FileText className="w-3 h-3" />,
  LINK: <Link2 className="w-3 h-3" />,
};
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};

const blankTask = (idx: number): TaskDraft => ({
  title: "New task", description: "", type: "ACTION",
  priority: "MEDIUM", url: "", content: "", dueDate: "", orderIndex: idx,
});

export function PlanBuilder() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState("onboarding");
  const [deadline, setDeadline] = useState("");
  const [phases, setPhases] = useState<PhaseDraft[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editingTask, setEditingTask] = useState<{ phaseIdx: number; taskIdx: number } | null>(null);

  async function handleGenerate() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const context = `Plan type: ${planType}${deadline ? `. Deadline: ${deadline}` : ""}\n\n${aiText}`;
      const generated: GeneratedPlan = await api.ai.generatePlan(context);
      const newPhases: PhaseDraft[] = generated.phases.map((p, i) => ({
        title: p.title, orderIndex: i,
        tasks: p.tasks.map((t, j) => ({
          title: t.title, description: t.description ?? "",
          type: t.type ?? "ACTION", priority: t.priority ?? "MEDIUM",
          url: t.url ?? "", content: "", dueDate: "", orderIndex: j,
        })),
      }));
      setPhases(newPhases);
      if (!title) setTitle(`${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`);
    } catch {
      setAiError("AI generation failed. Check your GROQ_API_KEY or try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function addPhase() {
    setPhases((p) => [...p, { title: "New Phase", orderIndex: p.length, tasks: [] }]);
  }
  function removePhase(i: number) {
    setPhases((p) => p.filter((_, idx) => idx !== i));
  }
  function updatePhaseTitle(i: number, v: string) {
    setPhases((p) => p.map((ph, idx) => idx === i ? { ...ph, title: v } : ph));
  }
  function togglePhase(i: number) {
    setPhases((p) => p.map((ph, idx) => idx === i ? { ...ph, collapsed: !ph.collapsed } : ph));
  }
  function addTask(pi: number) {
    setPhases((p) => p.map((ph, i) =>
      i === pi ? { ...ph, tasks: [...ph.tasks, blankTask(ph.tasks.length)] } : ph
    ));
  }
  function removeTask(pi: number, ti: number) {
    setPhases((p) => p.map((ph, i) =>
      i === pi ? { ...ph, tasks: ph.tasks.filter((_, j) => j !== ti) } : ph
    ));
  }
  function updateTask(pi: number, ti: number, field: keyof TaskDraft, value: string) {
    setPhases((p) => p.map((ph, i) =>
      i === pi ? { ...ph, tasks: ph.tasks.map((t, j) => j === ti ? { ...t, [field]: value } : t) } : ph
    ));
  }

  async function handleSave() {
    if (!title.trim()) { setSaveError("Plan title is required."); return; }
    if (phases.length === 0) { setSaveError("Add at least one phase before saving."); return; }
    const emptyPhase = phases.find((p) => p.tasks.length === 0);
    if (emptyPhase) { setSaveError(`Phase "${emptyPhase.title}" has no tasks — add at least one task.`); return; }
    const missingUrl = phases.flatMap((p) => p.tasks).find((t) => t.type === "LINK" && !t.url.trim());
    if (missingUrl) { setSaveError(`Task "${missingUrl.title}" is type Link — a URL is required.`); return; }
    setSaving(true); setSaveError("");
    try {
      const input: CreatePlanInput = {
        title: title.trim(),
        description: [description.trim(), deadline ? `Deadline: ${deadline}` : ""].filter(Boolean).join("\n") || undefined,
        phases: phases.map((p, i) => ({
          title: p.title, orderIndex: i,
          tasks: p.tasks.map((t, j) => ({
            title: t.title, description: t.description || undefined,
            type: t.type, priority: t.priority,
            url: t.url || undefined,
            content: t.content || undefined,
            dueDate: t.dueDate || undefined,
            orderIndex: j,
          })),
        })),
      };
      await api.plans.create(input);
      router.push("/plans");
    } catch (e: any) {
      setSaveError(e.message ?? "Failed to save plan.");
    } finally {
      setSaving(false);
    }
  }

  const totalTasks = phases.reduce((s, p) => s + p.tasks.length, 0);

  return (
    <div className="flex gap-6 items-start">
      {/* LEFT: details + AI generator */}
      <div className="w-80 shrink-0 space-y-4 sticky top-0">
        {/* Plan Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Plan Details</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Plan Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer Onboarding"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Plan Type</label>
            <select value={planType} onChange={(e) => setPlanType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="onboarding">Onboarding</option>
              <option value="training">Training</option>
              <option value="compliance">Compliance</option>
              <option value="performance">Performance</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Plan Deadline
            </label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Brief overview of this plan's goals..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* AI Generator */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <h2 className="font-semibold">Generate with AI</h2>
          </div>
          <p className="text-indigo-200 text-xs mb-3 leading-relaxed">
            Describe the role, requirements, or paste a job description. AI builds the full plan.
          </p>
          <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={5}
            placeholder="e.g. 'We need to onboard a new frontend developer. They should learn our React codebase, CI/CD pipeline, and deployment workflow over 4 weeks...'"
            className="w-full px-3 py-2 bg-white/15 border border-white/20 rounded-lg text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none mb-3"
          />
          {aiError && (
            <div className="flex items-center gap-1.5 text-red-200 text-xs mb-3">
              <AlertCircle className="w-3.5 h-3.5" />{aiError}
            </div>
          )}
          <button onClick={handleGenerate} disabled={aiLoading || !aiText.trim()}
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-white text-indigo-700 font-semibold text-sm rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
          >
            {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Brain className="w-4 h-4" />Generate Plan</>}
          </button>
          {phases.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-indigo-200 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              {phases.length} phases · {totalTasks} tasks generated
            </div>
          )}
        </div>

        {/* Save bar — always visible */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          {saveError && (
            <div className="flex items-center gap-2 text-red-600 text-xs mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
            </div>
          )}
          {phases.length > 0 && (
            <p className="text-xs text-gray-400 mb-3">{phases.length} phase{phases.length !== 1 ? "s" : ""} · {totalTasks} task{totalTasks !== 1 ? "s" : ""}</p>
          )}
          <button onClick={handleSave} disabled={saving || (!title.trim() && phases.length === 0)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Plan</>}
          </button>
          {!title.trim() && <p className="text-xs text-gray-400 mt-2 text-center">Enter a plan title to save</p>}
        </div>
      </div>

      {/* RIGHT: phases */}
      <div className="flex-1 min-w-0 space-y-3">
        {phases.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500 mb-1">No phases yet</p>
            <p className="text-sm text-gray-400 mb-4">Use the AI generator or add phases manually.</p>
            <button onClick={addPhase}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Phase Manually
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Plan Structure
                <span className="ml-2 text-xs font-normal text-gray-400">{phases.length} phases · {totalTasks} tasks</span>
              </h2>
              <button onClick={addPhase}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <Plus className="w-4 h-4" /> Add Phase
              </button>
            </div>

            {phases.map((phase, phaseIdx) => (
              <div key={phaseIdx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Phase header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <button onClick={() => togglePhase(phaseIdx)} className="text-gray-400 hover:text-gray-600 shrink-0">
                    {phase.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {phaseIdx + 1}
                  </div>
                  <input value={phase.title} onChange={(e) => updatePhaseTitle(phaseIdx, e.target.value)}
                    className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-none outline-none"
                  />
                  <span className="text-xs text-gray-400 shrink-0">{phase.tasks.length} tasks</span>
                  <button onClick={() => removePhase(phaseIdx)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Tasks */}
                {!phase.collapsed && (
                  <div className="divide-y divide-gray-50">
                    {phase.tasks.map((task, taskIdx) => {
                      const isEditing = editingTask?.phaseIdx === phaseIdx && editingTask?.taskIdx === taskIdx;
                      return (
                        <div key={taskIdx} className={`px-4 py-3 ${isEditing ? "bg-indigo-50/60 border-l-2 border-indigo-400" : ""}`}>
                          {isEditing ? (
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 mb-1">
                                ✏️ Editing task
                              </p>
                              <input value={task.title}
                                onChange={(e) => updateTask(phaseIdx, taskIdx, "title", e.target.value)}
                                className="w-full text-sm font-medium border border-indigo-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <textarea value={task.description}
                                onChange={(e) => updateTask(phaseIdx, taskIdx, "description", e.target.value)}
                                rows={2} placeholder="Task description…"
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              />

                              {/* LINK: URL field (required) */}
                              {task.type === "LINK" && (
                                <div className="space-y-1">
                                  <div className="relative">
                                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input type="url" value={task.url}
                                      onChange={(e) => updateTask(phaseIdx, taskIdx, "url", e.target.value)}
                                      placeholder="https://docs.company.com/guide"
                                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        !task.url.trim() ? "border-rose-300 bg-rose-50/40" : "border-gray-200"
                                      }`}
                                    />
                                  </div>
                                  {!task.url.trim() && (
                                    <p className="text-xs text-rose-600 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> URL is required for Link tasks
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* DOCUMENT: hint to attach files after saving */}
                              {task.type === "DOCUMENT" && (
                                <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                  <p className="text-xs text-indigo-600 leading-relaxed">
                                    Save the plan first, then attach files (PDF, Word, images…) directly to this task on the plan detail page.
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-3 gap-2">
                                <select value={task.type}
                                  onChange={(e) => updateTask(phaseIdx, taskIdx, "type", e.target.value)}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-2"
                                >
                                  <option value="ACTION">Action</option>
                                  <option value="DOCUMENT">Document</option>
                                  <option value="LINK">Link</option>
                                </select>
                                <select value={task.priority}
                                  onChange={(e) => updateTask(phaseIdx, taskIdx, "priority", e.target.value)}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-2"
                                >
                                  <option value="HIGH">High Priority</option>
                                  <option value="MEDIUM">Medium Priority</option>
                                  <option value="LOW">Low Priority</option>
                                </select>
                                <div className="relative">
                                  <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                  <input type="date" value={task.dueDate}
                                    onChange={(e) => updateTask(phaseIdx, taskIdx, "dueDate", e.target.value)}
                                    className="w-full pl-7 pr-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button onClick={() => setEditingTask(null)}
                                  className="flex items-center gap-1.5 text-sm text-white font-semibold px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Done editing
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border shrink-0 ${TYPE_STYLES[task.type] ?? TYPE_STYLES.ACTION}`}>
                                {TYPE_ICONS[task.type]}{task.type}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-800">{task.title}</span>
                                {task.url ? (
                                  <span className="flex items-center gap-1 text-xs text-indigo-500 mt-0.5">
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="truncate max-w-[200px]">{task.url}</span>
                                  </span>
                                ) : task.type === "LINK" && (
                                  <span className="flex items-center gap-1 text-xs text-rose-500 mt-0.5">
                                    <AlertCircle className="w-3 h-3" /> URL missing — click Edit
                                  </span>
                                )}
                              </div>
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => setEditingTask({ phaseIdx, taskIdx })}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 rounded-lg hover:bg-indigo-50 border border-indigo-100 transition-colors"
                                >
                                  Edit
                                </button>
                                <button onClick={() => removeTask(phaseIdx, taskIdx)}
                                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="px-4 py-2">
                      <button onClick={() => addTask(phaseIdx)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
