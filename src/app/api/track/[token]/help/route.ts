import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { sendMail } from "@/backend/lib/mailer";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { taskId, taskTitle, message } = await req.json();
  if (!taskId || !message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    include: {
      employee: true,
      plan: { include: { manager: { select: { id: true, email: true, name: true } } } },
    },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { employee, plan } = assignment;
  const manager = plan.manager;

  // Upsert TaskProgress — mark in-progress and save help note
  const helpNote = `🚩 Help requested: ${message.trim()}`;
  await prisma.taskProgress.upsert({
    where: { assignmentId_taskId: { assignmentId: assignment.id, taskId } },
    create: { assignmentId: assignment.id, taskId, status: "IN_PROGRESS", notes: helpNote },
    update: { notes: helpNote },
  });

  // Notify manager via email (non-blocking — failure doesn't break the response)
  sendMail({
    to: manager.email,
    subject: `🚩 ${employee.name} needs help — "${taskTitle}"`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#4f46e5;border-radius:12px;padding:24px;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:20px">Help Request</h1>
          <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px">${plan.title}</p>
        </div>
        <p style="color:#374151;font-size:15px;margin-bottom:16px">
          <strong>${employee.name}</strong> is stuck on a task and needs your help.
        </p>
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:16px">
          <p style="margin:0;font-size:12px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:.05em">Task</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#78350f">${taskTitle}</p>
        </div>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border-left:3px solid #4f46e5">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">"${message.trim()}"</p>
        </div>
        <p style="color:#6b7280;font-size:13px">
          Log in to TrackPulse to follow up. Reply directly to this email or send a nudge from the dashboard.
        </p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px">
          TrackPulse · Training progress tracking
        </p>
      </div>
    `,
  }).catch(() => { /* email failure is non-fatal */ });

  // Create in-app notification for manager
  const notifId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO notifications (id, manager_id, type, title, body, link, created_at)
    VALUES (
      ${notifId}, ${assignment.plan.manager.id}, 'HELP_REQUEST',
      ${`${employee.name} needs help`},
      ${`"${taskTitle ?? "Task"}" — ${message.trim()}`},
      ${`/employees/${assignment.employeeId}`},
      NOW()
    )
  `;

  return NextResponse.json({ ok: true });
}
