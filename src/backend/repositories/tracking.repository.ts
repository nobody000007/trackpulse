import { prisma } from "@/backend/lib/prisma";
import { randomUUID } from "crypto";

interface InsertEventData {
  assignmentId: string;
  taskId: string;
  eventType: string;
  sessionId?: string;
  readTimeSec?: number;
  scrollDepthPct?: number;
  userAgent?: string;
}

export class TrackingRepository {
  static async insertEvent(data: InsertEventData) {
    // Use raw SQL to bypass Prisma client enum validation (client may lag behind schema).
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO tracking_events
        (id, assignment_id, task_id, event_type, session_id, read_time_sec, scroll_depth_pct, user_agent, timestamp)
      VALUES (
        ${id},
        ${data.assignmentId},
        ${data.taskId},
        ${data.eventType}::"EventType",
        ${data.sessionId ?? null},
        ${data.readTimeSec ?? null},
        ${data.scrollDepthPct ?? null},
        ${data.userAgent ?? null},
        NOW()
      )
    `;
    return { id };
  }

  static async getAggregatedStats(assignmentId: string, taskId: string) {
    return prisma.trackingEvent.aggregate({
      where: { assignmentId, taskId },
      _count: { id: true },
      _max: { scrollDepthPct: true, readTimeSec: true, timestamp: true },
      _sum: { readTimeSec: true },
    });
  }

  static async getAssignmentStats(assignmentId: string) {
    // Use raw SQL to avoid Prisma enum issues (LINK_RETURN).
    return prisma.$queryRaw`
      SELECT * FROM tracking_events WHERE assignment_id = ${assignmentId} ORDER BY timestamp DESC
    `;
  }
}
