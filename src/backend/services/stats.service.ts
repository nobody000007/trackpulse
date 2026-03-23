import { prisma } from "@/backend/lib/prisma";
import { Prisma } from "@prisma/client";

export class StatsService {
  static async getDashboardStats(managerId: string) {
    const [employees, plans, assignments] = await Promise.all([
      prisma.employee.findMany({
        where: { managerId },
        include: {
          assignments: {
            where: { status: "ACTIVE" },
            include: {
              plan: {
                include: {
                  phases: { include: { tasks: { select: { id: true } } } },
                },
              },
              progress: {
                include: { task: { select: { id: true, title: true, type: true } } },
                orderBy: { updatedAt: "desc" },
              },
            },
            orderBy: { assignedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.plan.findMany({
        where: { managerId },
        include: {
          phases: { include: { tasks: { select: { id: true } } } },
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.assignment.findMany({
        where: { plan: { managerId }, status: "ACTIVE" },
        include: {
          progress: { select: { status: true } },
          plan: {
            include: { phases: { include: { tasks: { select: { id: true } } } } },
          },
        },
      }),
    ]);

    // Fetch last event per assignment via raw SQL (avoid Prisma enum issues with LINK_RETURN).
    const allAssignmentIds = [
      ...employees.flatMap((e) => e.assignments.map((a) => a.id)),
      ...assignments.map((a) => a.id),
    ].filter((id, i, arr) => arr.indexOf(id) === i);

    const lastEvents = allAssignmentIds.length > 0
      ? await prisma.$queryRaw<{ assignment_id: string; timestamp: Date }[]>`
          SELECT DISTINCT ON (assignment_id) assignment_id, timestamp
          FROM tracking_events
          WHERE assignment_id IN (${Prisma.join(allAssignmentIds)})
          ORDER BY assignment_id, timestamp DESC
        `
      : [];
    const lastEventMap = new Map(lastEvents.map((e) => [e.assignment_id, e.timestamp]));

    const enrichedEmployees = employees.map((emp) => {
      const enrichedAssignments = emp.assignments.map((assignment) => {
        const totalTasks = (assignment.plan as any).phases?.reduce(
          (sum: number, phase: any) => sum + phase.tasks.length, 0
        ) ?? 0;
        const completedTasks = assignment.progress.filter((p) => p.status === "COMPLETED").length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const lastActivity = lastEventMap.get(assignment.id) ?? null;
        const daysSinceActivity = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        let riskLevel: "GREEN" | "YELLOW" | "RED" = "GREEN";
        if (daysSinceActivity >= 3 && completionRate < 100) riskLevel = "RED";
        else if (completionRate < 50 && daysSinceActivity >= 1) riskLevel = "YELLOW";

        const currentTask = assignment.progress.find((p) => p.status === "IN_PROGRESS")?.task ?? null;
        return { ...assignment, completionRate, riskLevel, lastActivity, totalTasks, completedTasks, currentTask };
      });

      return { ...emp, assignments: enrichedAssignments };
    });

    const totalCompletionRates = assignments.map((a) => {
      const totalTasks = a.plan.phases.reduce(
        (sum: number, phase: any) => sum + phase.tasks.length, 0
      );
      const completedTasks = a.progress.filter((p) => p.status === "COMPLETED").length;
      return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    });

    const avgCompletionRate =
      totalCompletionRates.length > 0
        ? Math.round(totalCompletionRates.reduce((a, b) => a + b, 0) / totalCompletionRates.length)
        : 0;

    const atRiskCount = enrichedEmployees.filter((emp) =>
      emp.assignments.some((a) => a.riskLevel === "RED" || a.riskLevel === "YELLOW")
    ).length;

    return {
      totalEmployees: employees.length,
      totalPlans: plans.length,
      avgCompletionRate,
      atRiskCount,
      employees: enrichedEmployees,
      plans: plans.map((p) => ({
        ...p,
        totalTasks: p.phases.reduce((sum, phase) => sum + phase.tasks.length, 0),
      })),
    };
  }

  static async getEmployeeEngagement(assignmentId: string) {
    // Use raw SQL to avoid Prisma enum issues (LINK_RETURN).
    return prisma.$queryRaw<{ id: string; task_id: string; event_type: string; read_time_sec: number | null; timestamp: Date }[]>`
      SELECT id, task_id, event_type, read_time_sec, timestamp
      FROM tracking_events
      WHERE assignment_id = ${assignmentId}
      ORDER BY timestamp DESC
    `;
  }

  static async getComparativeStats(planId: string) {
    return prisma.assignment.findMany({
      where: { planId },
      include: { employee: true, progress: true },
    });
  }
}
