import type { TaskType, Priority } from "./enums";

export interface Task {
  id: string;
  phaseId: string;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: Priority;
  dueDate?: Date | null;
  url?: string | null;
  orderIndex: number;
}

export interface Phase {
  id: string;
  planId: string;
  title: string;
  orderIndex: number;
  tasks: Task[];
}

export interface Plan {
  id: string;
  managerId: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  phases: Phase[];
}
