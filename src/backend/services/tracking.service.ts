import { TrackingRepository } from "@/backend/repositories/tracking.repository";
import { ProgressRepository } from "@/backend/repositories/progress.repository";
import { AssignmentRepository } from "@/backend/repositories/assignment.repository";
import type { TrackingEventInput, UpdateTaskProgressInput } from "@/shared/types/api";

export class TrackingService {
  static async recordEvent(token: string, input: TrackingEventInput) {
    const assignment = await AssignmentRepository.findByToken(token);
    if (!assignment) throw new Error("Invalid token");

    return TrackingRepository.insertEvent({
      assignmentId: assignment.id,
      taskId: input.taskId,
      eventType: input.eventType,
      sessionId: input.sessionId,
      readTimeSec: input.readTimeSec,
      scrollDepthPct: input.scrollDepthPct,
      userAgent: input.userAgent,
    });
  }

  static async updateTaskProgress(token: string, taskId: string, input: UpdateTaskProgressInput) {
    const assignment = await AssignmentRepository.findByToken(token);
    if (!assignment) throw new Error("Invalid token");

    return ProgressRepository.upsert({
      assignmentId: assignment.id,
      taskId,
      status: input.status,
      notes: input.notes,
    });
  }

  static async getEngagementStats(assignmentId: string, taskId: string) {
    return TrackingRepository.getAggregatedStats(assignmentId, taskId);
  }
}
