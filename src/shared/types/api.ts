import type { TaskType, Priority, ProgressStatus, EventType } from "./enums";
import type { Plan } from "./plan";
import type { Employee, Assignment } from "./employee";
import type { TaskProgress } from "./tracking";

export interface CreatePlanInput {
  title: string;
  description?: string;
  phases?: Array<{
    title: string;
    orderIndex: number;
    tasks: Array<{
      title: string;
      description?: string;
      type: TaskType | string;
      priority: Priority | string;
      dueDate?: string;
      url?: string;
      orderIndex: number;
    }>;
  }>;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  role?: string;
  strengths?: string;
  weaknesses?: string;
}

export interface CreateAssignmentInput {
  planId: string;
  employeeId: string;
}

export interface TrackingEventInput {
  taskId: string;
  eventType: EventType;
  sessionId?: string;
  readTimeSec?: number;
  scrollDepthPct?: number;
  userAgent?: string;
}

export interface UpdateTaskProgressInput {
  status?: ProgressStatus;
  notes?: string;
}

export interface GeneratedPlan {
  phases: Array<{
    title: string;
    tasks: Array<{
      title: string;
      description?: string;
      type: string;
      priority: string;
      suggestedDays?: number;
    }>;
  }>;
}

export interface DashboardData {
  totalEmployees: number;
  totalPlans: number;
  avgCompletionRate: number;
  atRiskCount: number;
  employees: Array<Employee & {
    assignments: Array<Assignment & {
      completionRate: number;
      riskLevel: string;
    }>;
  }>;
}
