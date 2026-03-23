import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      employee: true,
      plan: {
        include: {
          phases: {
            include: {
              tasks: {
                include: { progress: { where: { assignment: { id: params.id } } } },
                orderBy: { orderIndex: "asc" },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      },
      progress: {
        include: { task: true },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership
  const plan = await prisma.plan.findFirst({ where: { id: assignment.planId, managerId: session.user.id } });
  if (!plan) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch events via raw SQL to avoid Prisma enum validation errors (LINK_RETURN).
  const rawEvents = await prisma.$queryRaw<{ id: string; task_id: string; event_type: string; read_time_sec: number | null; scroll_depth_pct: number | null; timestamp: Date }[]>`
    SELECT id, task_id, event_type, read_time_sec, scroll_depth_pct, timestamp
    FROM tracking_events
    WHERE assignment_id = ${params.id}
    ORDER BY timestamp DESC
    LIMIT 50
  `;
  // Normalize to camelCase so the client component receives expected field names.
  const events = rawEvents.map((e) => ({
    id: e.id,
    taskId: e.task_id,
    eventType: e.event_type,
    readTimeSec: e.read_time_sec != null ? Number(e.read_time_sec) : null,
    scrollDepthPct: e.scroll_depth_pct != null ? Number(e.scroll_depth_pct) : null,
    timestamp: e.timestamp,
  }));

  const totalTasks = assignment.plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const completedTasks = assignment.progress.filter((p) => p.status === "COMPLETED").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const lastActivity = events[0]?.timestamp ?? null;
  const daysSinceActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let riskLevel: "GREEN" | "YELLOW" | "RED" = "GREEN";
  if (daysSinceActivity !== null && daysSinceActivity >= 3 && completionRate < 100) riskLevel = "RED";
  else if (completionRate < 50 && (daysSinceActivity === null || daysSinceActivity >= 1)) riskLevel = "YELLOW";

  return NextResponse.json({ ...assignment, events, completionRate, riskLevel, lastActivity, totalTasks, completedTasks });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: { plan: { select: { managerId: true } } },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.plan.managerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete dependent rows before the assignment
  await prisma.$executeRaw`DELETE FROM manager_replies WHERE assignment_id = ${params.id}`;
  await prisma.$executeRaw`DELETE FROM task_progress WHERE assignment_id = ${params.id}`;
  await prisma.$executeRaw`DELETE FROM tracking_events WHERE assignment_id = ${params.id}`;
  await prisma.assignment.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
