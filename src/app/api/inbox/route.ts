import { auth } from "@/backend/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const managerId = session.user.id;

  // All help requests across all employees
  const helpRequests = await prisma.$queryRaw<{
    assignment_id: string;
    task_id: string;
    notes: string;
    updated_at: Date;
    employee_id: string;
    employee_name: string;
    plan_title: string;
    task_title: string;
  }[]>`
    SELECT
      tp.assignment_id,
      tp.task_id,
      tp.notes,
      tp.updated_at,
      e.id   AS employee_id,
      e.name AS employee_name,
      pl.title AS plan_title,
      t.title  AS task_title
    FROM task_progress tp
    JOIN assignments a  ON a.id  = tp.assignment_id
    JOIN employees   e  ON e.id  = a.employee_id
    JOIN plans       pl ON pl.id = a.plan_id
    JOIN tasks       t  ON t.id  = tp.task_id
    WHERE pl.manager_id = ${managerId}
      AND tp.notes LIKE '🚩 Help requested:%'
    ORDER BY tp.updated_at DESC
  `;

  if (helpRequests.length === 0) {
    return NextResponse.json({ items: [], unreadCount: 0 });
  }

  // All replies for assignments owned by this manager
  const allReplies = await prisma.$queryRaw<{
    assignment_id: string;
    task_id: string;
    id: string;
    message: string;
    created_at: Date;
  }[]>`
    SELECT mr.assignment_id, mr.task_id, mr.id, mr.message, mr.created_at
    FROM manager_replies mr
    JOIN assignments a ON a.id = mr.assignment_id
    JOIN plans p ON p.id = a.plan_id
    WHERE p.manager_id = ${managerId}
    ORDER BY mr.created_at ASC
  `;

  const replyMap = new Map<string, { id: string; message: string; createdAt: Date }[]>();
  for (const r of allReplies) {
    const key = `${r.assignment_id}:${r.task_id}`;
    if (!replyMap.has(key)) replyMap.set(key, []);
    replyMap.get(key)!.push({ id: r.id, message: r.message, createdAt: r.created_at });
  }

  const items = helpRequests.map((hr) => {
    const key = `${hr.assignment_id}:${hr.task_id}`;
    const message = hr.notes.replace(/^🚩 Help requested:\s*/, "").trim();
    return {
      assignmentId: hr.assignment_id,
      taskId: hr.task_id,
      employeeId: hr.employee_id,
      employeeName: hr.employee_name,
      planTitle: hr.plan_title,
      taskTitle: hr.task_title,
      message,
      requestedAt: hr.updated_at,
      replies: replyMap.get(key) ?? [],
    };
  });

  const unreadCount = items.filter((i) => i.replies.length === 0).length;

  return NextResponse.json({ items, unreadCount });
}
