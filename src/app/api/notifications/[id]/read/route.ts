import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$executeRaw`
    UPDATE notifications SET read_at = NOW()
    WHERE id = ${params.id} AND manager_id = ${session.user.id} AND read_at IS NULL
  `;
  return NextResponse.json({ ok: true });
}
