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

  static async findByTokenWithDetails(token: string) {
    const assignment = await AssignmentRepository.findByToken(token);
    if (!assignment) return null;

    const id = (assignment as any).id as string;

    const [rawLinkEvents, metaRows, submissionRows] = await Promise.all([
      prisma.$queryRaw<{ task_id: string; read_time_sec: number | null }[]>`
        SELECT task_id, read_time_sec FROM tracking_events
        WHERE assignment_id = ${id} AND event_type = 'LINK_RETURN'
      `,
      prisma.$queryRaw<{ status_note: string | null }[]>`
        SELECT status_note FROM assignments WHERE id = ${id}
      `,
      prisma.$queryRaw<{ task_id: string; submission_url: string | null; submission_name: string | null }[]>`
        SELECT task_id, submission_url, submission_name FROM task_progress
        WHERE assignment_id = ${id}
          AND (submission_url IS NOT NULL OR submission_name IS NOT NULL)
      `,
    ]);

    const linkReadSeconds: Record<string, number> = {};
    for (const e of rawLinkEvents) {
      if (e.task_id && e.read_time_sec) {
        linkReadSeconds[e.task_id] = (linkReadSeconds[e.task_id] ?? 0) + e.read_time_sec;
      }
    }

    const submissionByTaskId = new Map(
      submissionRows.map((r) => [r.task_id, { submissionUrl: r.submission_url, submissionName: r.submission_name }])
    );

    return {
      assignment,
      linkReadSeconds,
      statusNote: metaRows[0]?.status_note ?? "",
      submissionByTaskId,
    };
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

  static async findTokenExists(token: string) {
    return prisma.assignment.findUnique({ where: { token }, select: { id: true } });
  }

  static async updateStatus(assignmentId: string, status: AssignmentStatus) {
    return prisma.assignment.update({ where: { id: assignmentId }, data: { status } });
  }
}
