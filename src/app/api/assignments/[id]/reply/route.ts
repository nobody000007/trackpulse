import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { sendMail } from "@/backend/lib/mailer";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, message } = await req.json();
  if (!taskId || !message?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify ownership
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      plan: { select: { managerId: true, title: true } },
      employee: { select: { email: true, name: true } },
    },
  });
  if (!assignment || assignment.plan.managerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch task title for email
  const taskRows = await prisma.$queryRaw<{ title: string }[]>`SELECT title FROM tasks WHERE id = ${taskId}`;
  const taskTitle = taskRows[0]?.title ?? "your task";

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO manager_replies (id, assignment_id, task_id, message, created_at)
    VALUES (${id}, ${params.id}, ${taskId}, ${message.trim()}, NOW())
  `;

  // Send email to employee
  const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${assignment.token}`;
  try {
    await sendMail({
      to: assignment.employee.email,
      subject: `Your manager replied to your help request — ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <h2 style="color: #4f46e5;">Your manager has replied</h2>
          <p>Hi ${assignment.employee.name},</p>
          <p>Your manager replied to your help request on <strong>${taskTitle}</strong> in <strong>${assignment.plan.title}</strong>:</p>
          <blockquote style="border-left: 3px solid #4f46e5; margin: 16px 0; padding: 12px 16px; background: #f5f3ff; border-radius: 0 8px 8px 0; color: #374151;">
            ${message.trim()}
          </blockquote>
          <a href="${trackUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View your training plan
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">TrackPulse — Employee Training Platform</p>
        </div>
      `,
    });
  } catch {
    // Email failure is non-fatal
  }

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
