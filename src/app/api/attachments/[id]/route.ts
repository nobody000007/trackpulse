import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { deleteBlob } from "@/backend/lib/blob-storage";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({
    where: { id: params.id },
    include: {
      task: {
        include: {
          phase: {
            include: { plan: { select: { managerId: true } } },
          },
        },
      },
    },
  });

  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attachment.task.phase.plan.managerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from Azure Blob Storage
  try {
    const url = new URL(attachment.blobUrl);
    // pathname is /{container}/{blobPath...}, skip first two segments
    const blobName = url.pathname.split("/").slice(2).join("/");
    await deleteBlob(blobName);
  } catch {
    // Blob may not exist — continue to delete the DB record
  }

  await prisma.attachment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
