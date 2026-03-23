import { prisma } from "@/backend/lib/prisma";
import type { ProgressStatus } from "@prisma/client";

export class ProgressRepository {
  static async upsert(data: {
    assignmentId: string;
    taskId: string;
    status?: ProgressStatus;
    notes?: string;
  }) {
    return prisma.taskProgress.upsert({
      where: { assignmentId_taskId: { assignmentId: data.assignmentId, taskId: data.taskId } },
      create: {
        assignmentId: data.assignmentId,
        taskId: data.taskId,
        status: data.status || "NOT_STARTED",
        notes: data.notes,
      },
      update: {
        status: data.status,
        notes: data.notes,
      },
    });
  }

  static async findByAssignment(assignmentId: string) {
    return prisma.taskProgress.findMany({ where: { assignmentId } });
  }
}
