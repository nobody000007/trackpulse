import { auth } from "@/backend/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.$queryRaw<{
    id: string; type: string; title: string; body: string;
    link: string | null; read_at: Date | null; created_at: Date;
  }[]>`
    SELECT id, type, title, body, link, read_at, created_at
    FROM notifications
    WHERE manager_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 30
  `;

  const notifications = rows.map((r) => ({
    id: r.id, type: r.type, title: r.title, body: r.body,
    link: r.link, readAt: r.read_at, createdAt: r.created_at,
  }));
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return NextResponse.json({ notifications, unreadCount });
}
