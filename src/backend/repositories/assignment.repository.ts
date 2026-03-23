import { prisma } from "@/backend/lib/prisma";
import type { AssignmentStatus } from "@prisma/client";

export class AssignmentRepository {
  static async create(data: { planId: string; employeeId: string }) {
    
    return prisma.assignment.create({
      data,
      include: { plan: true, employee: true },
    });
  }

  static async findByToken(token: string) {
    
    return prisma.assignment.findUnique({
      where: { token },
      include: {
        plan: {
          include: {
            phases: {
              include: { tasks: { include: { attachments: true }, orderBy: { orderIndex: "asc" } } },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        employee: true,
        progress: true,
      },
    });
  }

  static async findById(assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        plan: { include: { phases: { include: { tasks: true } } } },
        employee: true,
        progress: true,
      },
    });
    if (!assignment) return null;
    // Fetch events via raw SQL to avoid Prisma enum issues (LINK_RETURN).
    const events = await prisma.$queryRaw<{ id: string; task_id: string; event_type: string; read_time_sec: number | null; timestamp: Date }[]>`
      SELECT id, task_id, event_type, read_time_sec, timestamp
      FROM tracking_events WHERE assignment_id = ${assignmentId}
      ORDER BY timestamp DESC LIMIT 100
    `;
    return { ...assignment, events };
  }

  static async findByPlan(planId: string) {
    
    return prisma.assignment.findMany({
      where: { planId },
      include: { employee: true, progress: true },
    });
  }

  static async updateStatus(assignmentId: string, status: AssignmentStatus) {
    
    return prisma.assignment.update({ where: { id: assignmentId }, data: { status } });
  }
}
