"use client";

interface Task {
  title: string;
  description?: string;
  type: string;
  priority: string;
  orderIndex: number;
}

interface Phase {
  title: string;
  orderIndex: number;
  tasks: Task[];
}

interface PhaseListProps {
  phases: Phase[];
  onUpdate: (phases: Phase[]) => void;
}

export function PhaseList({ phases, onUpdate }: PhaseListProps) {
  function addPhase() {
    onUpdate([...phases, { title: "", orderIndex: phases.length, tasks: [] }]);
  }

  function updatePhase(index: number, updates: Partial<Phase>) {
    const updated = [...phases];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Phases</h3>
        <button
          type="button"
          onClick={addPhase}
          className="text-sm text-indigo-600 hover:underline"
        >
          + Add Phase
        </button>
      </div>
      {phases.map((phase, i) => (
        <div key={i} className="border border-gray-200 rounded-md p-4 space-y-3">
          <input
            type="text"
            placeholder="Phase title"
            value={phase.title}
            onChange={(e) => updatePhase(i, { title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <p className="text-xs text-gray-500">{phase.tasks.length} tasks</p>
        </div>
      ))}
    </div>
  );
}
