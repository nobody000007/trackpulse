import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string; taskId: string } }
) {
  const { submissionUrl, submissionName } = await req.json();
  if (!submissionUrl?.trim() && !submissionName?.trim()) {
    return NextResponse.json({ error: "Provide a URL or description" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    include: {
      employee: { select: { name: true } },
      plan: { include: { manager: { select: { id: true, email: true, name: true } } } },
    },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get task title for notification
  const taskRow = await prisma.$queryRaw<{ title: string }[]>`
    SELECT title FROM tasks WHERE id = ${params.taskId} LIMIT 1
  `;
  const taskTitle = taskRow[0]?.title ?? "Unknown task";

  // Upsert submission on task_progress using raw SQL (new columns)
  const url = submissionUrl?.trim() || null;
  const name = submissionName?.trim() || null;
  await prisma.$executeRaw`
    INSERT INTO task_progress (id, assignment_id, task_id, status, submission_url, submission_name, submitted_at, updated_at)
    VALUES (${randomUUID()}, ${assignment.id}, ${params.taskId}, 'IN_PROGRESS', ${url}, ${name}, NOW(), NOW())
    ON CONFLICT (assignment_id, task_id) DO UPDATE
    SET submission_url = EXCLUDED.submission_url,
        submission_name = EXCLUDED.submission_name,
        submitted_at = NOW(),
        updated_at = NOW()
  `;

  // Create notification for manager
  const notifId = randomUUID();
  const managerId = assignment.plan.manager.id;
  const empName = assignment.employee.name;
  await prisma.$executeRaw`
    INSERT INTO notifications (id, manager_id, type, title, body, link, created_at)
    VALUES (
      ${notifId}, ${managerId}, 'SUBMISSION',
      ${`${empName} submitted work`},
      ${`"${taskTitle}" — ${name ?? url ?? ""}`},
      ${`/employees/${assignment.employeeId}`},
      NOW()
    )
  `;

  return NextResponse.json({ ok: true });
}
