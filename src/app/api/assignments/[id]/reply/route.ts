import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, message } = await req.json();
  if (!taskId || !message?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify ownership
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: { plan: { select: { managerId: true } }, employee: { select: { email: true, name: true } } },
  });
  if (!assignment || assignment.plan.managerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO manager_replies (id, assignment_id, task_id, message, created_at)
    VALUES (${id}, ${params.id}, ${taskId}, ${message.trim()}, NOW())
  `;

  // Clear the help-request flag from TaskProgress notes
  await prisma.$executeRaw`
    UPDATE task_progress SET notes = NULL
    WHERE assignment_id = ${params.id} AND task_id = ${taskId}
      AND notes LIKE '🚩 Help requested:%'
  `;

  return NextResponse.json({ ok: true, id });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.$queryRaw<{
    id: string; task_id: string; message: string; read_at: Date | null; created_at: Date;
  }[]>`
    SELECT id, task_id, message, read_at, created_at FROM manager_replies
    WHERE assignment_id = ${params.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows.map((r) => ({
    id: r.id, taskId: r.task_id, message: r.message,
    readAt: r.read_at, createdAt: r.created_at,
  })));
}
