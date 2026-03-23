import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    select: { id: true },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const replies = await prisma.$queryRaw<{
    id: string; task_id: string; message: string; read_at: Date | null; created_at: Date;
  }[]>`
    SELECT id, task_id, message, read_at, created_at FROM manager_replies
    WHERE assignment_id = ${assignment.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(replies.map((r) => ({
    id: r.id, taskId: r.task_id, message: r.message,
    readAt: r.read_at, createdAt: r.created_at,
  })));
}

// Employee marks a reply as read
export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const { replyId } = await req.json();
  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    select: { id: true },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$executeRaw`
    UPDATE manager_replies SET read_at = NOW()
    WHERE id = ${replyId} AND assignment_id = ${assignment.id} AND read_at IS NULL
  `;
  return NextResponse.json({ ok: true });
}
