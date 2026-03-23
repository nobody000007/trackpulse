import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const { note } = await req.json();

  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    select: { id: true },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Use raw SQL — statusNote/statusNoteAt may not be in the Prisma client yet.
  if (note) {
    await prisma.$executeRaw`
      UPDATE assignments
      SET status_note = ${note}, status_note_at = NOW()
      WHERE id = ${assignment.id}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE assignments
      SET status_note = NULL, status_note_at = NULL
      WHERE id = ${assignment.id}
    `;
  }

  return NextResponse.json({ ok: true });
}
