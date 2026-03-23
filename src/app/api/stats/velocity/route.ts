import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");
  const planId = searchParams.get("planId");
  if (!assignmentId || !planId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  // Employee's daily completions for the last 21 days
  const employeeDays = await prisma.$queryRaw<{ day: string; count: number }[]>`
    SELECT
      TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count
    FROM task_progress
    WHERE assignment_id = ${assignmentId}
      AND status = 'COMPLETED'
      AND updated_at >= NOW() - INTERVAL '21 days'
    GROUP BY day
    ORDER BY day
  `;

  // All other assignments on the same plan (team average)
  const teamDays = await prisma.$queryRaw<{ day: string; count: number; assignment_count: number }[]>`
    SELECT
      TO_CHAR(tp.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count,
      COUNT(DISTINCT tp.assignment_id)::int AS assignment_count
    FROM task_progress tp
    JOIN assignments a ON a.id = tp.assignment_id
    WHERE a.plan_id = ${planId}
      AND a.id != ${assignmentId}
      AND tp.status = 'COMPLETED'
      AND tp.updated_at >= NOW() - INTERVAL '21 days'
    GROUP BY day
    ORDER BY day
  `;

  // Build last 21 days array
  const days: string[] = [];
  for (let i = 20; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const empMap = new Map(employeeDays.map((r) => [r.day, Number(r.count)]));
  const teamMap = new Map(teamDays.map((r) => [r.day, { count: Number(r.count), assignments: Number(r.assignment_count) }]));

  const series = days.map((day) => ({
    day,
    employee: empMap.get(day) ?? 0,
    teamAvg: (() => {
      const t = teamMap.get(day);
      if (!t || t.assignments === 0) return 0;
      return Math.round((t.count / t.assignments) * 10) / 10;
    })(),
  }));

  return NextResponse.json({ series });
}
