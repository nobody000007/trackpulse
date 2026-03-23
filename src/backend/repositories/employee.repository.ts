import { prisma } from "@/backend/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CreateEmployeeInput } from "@/shared/types/api";

export class EmployeeRepository {
  static async create(data: CreateEmployeeInput & { managerId: string }) {
    return prisma.employee.create({ data });
  }

  static async findByManager(managerId: string) {
    const employees = await prisma.employee.findMany({
      where: { managerId },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            plan: { select: { id: true, title: true } },
            progress: {
              include: { task: { select: { id: true, title: true, type: true } } },
              orderBy: { updatedAt: "desc" },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch last event per assignment via raw SQL (avoid Prisma enum issues with LINK_RETURN).
    const assignmentIds = employees.flatMap((e) => e.assignments.map((a) => a.id));
    const lastEvents = assignmentIds.length > 0
      ? await prisma.$queryRaw<{ assignment_id: string; timestamp: Date }[]>`
          SELECT DISTINCT ON (assignment_id) assignment_id, timestamp
          FROM tracking_events
          WHERE assignment_id IN (${Prisma.join(assignmentIds)})
          ORDER BY assignment_id, timestamp DESC
        `
      : [];
    const lastEventMap = new Map(lastEvents.map((e) => [e.assignment_id, e.timestamp]));

    return employees.map((emp) => {
      if (emp.assignments.length === 0) {
        return { ...emp, riskLevel: "GREEN" as const, currentAssignment: null, lastActivity: null };
      }

      // Aggregate most recent activity across ALL active assignments
      let mostRecentActivity: Date | null = null;
      for (const a of emp.assignments) {
        const evt = lastEventMap.get(a.id);
        if (evt && (!mostRecentActivity || evt > mostRecentActivity)) mostRecentActivity = evt;
      }

      const daysSinceActivity = mostRecentActivity
        ? Math.floor((Date.now() - new Date(mostRecentActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let riskLevel: "GREEN" | "YELLOW" | "RED" = "GREEN";
      if (daysSinceActivity >= 3) riskLevel = "RED";
      else if (daysSinceActivity >= 1) riskLevel = "YELLOW";

      // Primary = most recently assigned; find first in-progress task across all plans
      const primary = emp.assignments[0];
      const inProgressTask = emp.assignments
        .flatMap((a) => a.progress)
        .find((p) => p.status === "IN_PROGRESS");

      return {
        ...emp,
        currentAssignment: {
          id: primary.id,
          planId: primary.planId,
          planTitle: (primary.plan as any)?.title ?? "",
          activePlansCount: emp.assignments.length,
          lastActivity: mostRecentActivity,
          currentTask: inProgressTask ? (inProgressTask as any).task : null,
          token: primary.token,
        },
        riskLevel,
        lastActivity: mostRecentActivity,
      };
    });
  }

  static async findById(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        assignments: {
          include: {
            plan: { include: { phases: { include: { tasks: true }, orderBy: { orderIndex: "asc" } } } },
            progress: { include: { task: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
    });
    if (!employee) return null;
    // Fetch events via raw SQL to avoid Prisma enum issues (LINK_RETURN).
    const assignmentIds = employee.assignments.map((a) => a.id);
    const events = assignmentIds.length > 0
      ? await prisma.$queryRaw<{ id: string; assignment_id: string; task_id: string; event_type: string; read_time_sec: number | null; timestamp: Date }[]>`
          SELECT id, assignment_id, task_id, event_type, read_time_sec, timestamp
          FROM tracking_events WHERE assignment_id IN (${Prisma.join(assignmentIds)})
          ORDER BY timestamp DESC LIMIT 20
        `
      : [];
    return { ...employee, events };
  }

  static async delete(employeeId: string) {
    return prisma.employee.delete({ where: { id: employeeId } });
  }
}
