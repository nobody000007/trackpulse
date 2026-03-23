import { auth } from "@/backend/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const managerId = session.user.id;

  const [employees, plans] = await Promise.all([
    prisma.employee.findMany({
      where: { managerId },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            plan: {
              select: {
                id: true, title: true,
                phases: { include: { tasks: { select: { id: true } } } },
              },
            },
            progress: { select: { status: true } },
          },
          orderBy: { assignedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.plan.findMany({
      where: { managerId },
      include: {
        phases: { include: { tasks: { select: { id: true } } } },
        _count: { select: { assignments: { where: { status: "ACTIVE" } } } },
      },
    }),
  ]);

  // Completion trend — last 30 days
  const completionTrend = await prisma.$queryRaw<{ day: string; count: number }[]>`
    SELECT
      TO_CHAR(tp.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count
    FROM task_progress tp
    JOIN assignments a ON a.id = tp.assignment_id
    JOIN plans p ON p.id = a.plan_id
    WHERE p.manager_id = ${managerId}
      AND tp.status = 'COMPLETED'
      AND tp.updated_at >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day
  `;

  // Engagement totals
  const [engRow] = await prisma.$queryRaw<{ total_events: number; total_read_time: number }[]>`
    SELECT
      COUNT(*)::int AS total_events,
      COALESCE(SUM(read_time_sec), 0)::int AS total_read_time
    FROM tracking_events te
    JOIN assignments a ON a.id = te.assignment_id
    JOIN plans p ON p.id = a.plan_id
    WHERE p.manager_id = ${managerId}
  `;

  // Last activity per assignment for risk
  const allAssignmentIds = employees.flatMap((e) => e.assignments.map((a) => a.id));
  const lastEvents = allAssignmentIds.length > 0
    ? await prisma.$queryRaw<{ assignment_id: string; timestamp: Date }[]>`
        SELECT DISTINCT ON (assignment_id) assignment_id, timestamp
        FROM tracking_events
        WHERE assignment_id IN (${Prisma.join(allAssignmentIds)})
        ORDER BY assignment_id, timestamp DESC
      `
    : [];
  const lastEventMap = new Map(lastEvents.map((e) => [e.assignment_id, e.timestamp]));

  // Per-employee stats
  const employeeStats = employees.map((emp) => {
    const assignment = emp.assignments[0];
    if (!assignment) return { id: emp.id, name: emp.name, completionRate: 0, riskLevel: "GREEN" as const, planTitle: null };

    const totalTasks = assignment.plan.phases.reduce((s, ph) => s + ph.tasks.length, 0);
    const completedTasks = assignment.progress.filter((p) => p.status === "COMPLETED").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const lastActivity = lastEventMap.get(assignment.id) ?? null;
    const daysSince = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : 999;

    let riskLevel: "GREEN" | "YELLOW" | "RED" = "GREEN";
    if (daysSince >= 3 && completionRate < 100) riskLevel = "RED";
    else if (completionRate < 50 && daysSince >= 1) riskLevel = "YELLOW";

    return { id: emp.id, name: emp.name, completionRate, riskLevel, planTitle: assignment.plan.title };
  });

  // Plan performance (match by plan id)
  const assignedEmployeesByPlan = new Map<string, typeof employeeStats>();
  employees.forEach((emp) => {
    const a = emp.assignments[0];
    if (!a) return;
    const arr = assignedEmployeesByPlan.get(a.plan.id) ?? [];
    const stat = employeeStats.find((s) => s.id === emp.id);
    if (stat) arr.push(stat);
    assignedEmployeesByPlan.set(a.plan.id, arr);
  });

  const planPerformance = plans.map((plan) => {
    const assigned = assignedEmployeesByPlan.get(plan.id) ?? [];
    const avg = assigned.length > 0
      ? Math.round(assigned.reduce((s, e) => s + e.completionRate, 0) / assigned.length)
      : 0;
    return {
      planId: plan.id,
      planTitle: plan.title,
      avgCompletion: avg,
      employeeCount: plan._count.assignments,
      totalTasks: plan.phases.reduce((s, ph) => s + ph.tasks.length, 0),
    };
  });

  // Build 30-day trend array
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const trendMap = new Map(completionTrend.map((r) => [r.day, Number(r.count)]));
  const trend = days.map((day) => ({ day, count: trendMap.get(day) ?? 0 }));

  const riskBreakdown = {
    green: employeeStats.filter((e) => e.riskLevel === "GREEN").length,
    yellow: employeeStats.filter((e) => e.riskLevel === "YELLOW").length,
    red: employeeStats.filter((e) => e.riskLevel === "RED").length,
  };

  return NextResponse.json({
    summary: {
      totalEmployees: employees.length,
      totalPlans: plans.length,
      avgCompletionRate: employeeStats.length > 0
        ? Math.round(employeeStats.reduce((s, e) => s + e.completionRate, 0) / employeeStats.length)
        : 0,
      atRiskCount: riskBreakdown.red + riskBreakdown.yellow,
      totalReadTimeSec: Number(engRow?.total_read_time ?? 0),
      totalEvents: Number(engRow?.total_events ?? 0),
    },
    riskBreakdown,
    completionTrend: trend,
    topPerformers: [...employeeStats]
      .filter((e) => e.planTitle)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 6),
    planPerformance,
  });
}
