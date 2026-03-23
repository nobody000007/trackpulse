import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { deleteBlob } from "@/backend/lib/blob-storage";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = updateSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = validated.data;
  const updates: Record<string, unknown> = {};

  if (name) updates.name = name;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const manager = await prisma.manager.findUnique({ where: { id: session.user.id } });
    if (!manager) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, manager.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "Nothing to update" });
  }

  const updated = await prisma.manager.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const managerId = session.user.id;

  // Collect all blob URLs: task attachments + submission files under this manager
  const [attachmentRows, subFileRows] = await Promise.all([
    prisma.$queryRaw<{ blob_url: string }[]>`
      SELECT a.blob_url FROM attachments a
      JOIN tasks t   ON t.id  = a.task_id
      JOIN phases ph ON ph.id = t.phase_id
      JOIN plans pl  ON pl.id = ph.plan_id
      WHERE pl.manager_id = ${managerId}
    `,
    prisma.$queryRaw<{ blob_url: string }[]>`
      SELECT sf.blob_url FROM submission_files sf
      JOIN assignments asgn ON asgn.id = sf.assignment_id
      JOIN plans pl         ON pl.id   = asgn.plan_id
      WHERE pl.manager_id = ${managerId}
    `,
  ]);

  // Delete all blobs (non-fatal — DB delete proceeds regardless)
  await Promise.allSettled(
    [...attachmentRows, ...subFileRows].map(async ({ blob_url }) => {
      try {
        const blobName = new URL(blob_url).pathname.split("/").slice(2).join("/");
        await deleteBlob(blobName);
      } catch {}
    })
  );

  // Delete the manager — DB cascade removes plans, phases, tasks, employees, assignments, progress, events, notifications, replies
  await prisma.manager.delete({ where: { id: managerId } });

  return NextResponse.json({ ok: true });
}
