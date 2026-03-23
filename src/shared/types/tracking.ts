import type { EventType, ProgressStatus } from "./enums";

export interface TrackingEvent {
  id: string;
  assignmentId: string;
  taskId: string;
  eventType: EventType;
  sessionId?: string | null;
  readTimeSec?: number | null;
  scrollDepthPct?: number | null;
  timestamp: Date;
}

export interface EngagementStats {
  taskId: string;
  openCount: number;
  totalReadTimeSec: number;
  maxScrollDepthPct: number;
  lastActivity?: Date;
}

export interface TaskProgress {
  id: string;
  assignmentId: string;
  taskId: string;
  status: ProgressStatus;
  notes?: string | null;
  updatedAt: Date;
}
