"use client";

interface TaskEditorProps {
  task: {
    title: string;
    description?: string;
    type: string;
    priority: string;
    url?: string;
    orderIndex: number;
  };
  onUpdate: (updates: Partial<TaskEditorProps["task"]>) => void;
  onDelete: () => void;
}

export function TaskEditor({ task, onUpdate, onDelete }: TaskEditorProps) {
  return (
    <div className="border border-gray-200 rounded p-3 space-y-2">
      <input
        type="text"
        placeholder="Task title"
        value={task.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
      />
      <div className="flex gap-2">
        <select
          value={task.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="ACTION">Action</option>
          <option value="DOCUMENT">Document</option>
          <option value="LINK">Link</option>
        </select>
        <select
          value={task.priority}
          onChange={(e) => onUpdate({ priority: e.target.value })}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm px-2">
          Remove
        </button>
      </div>
    </div>
  );
}
