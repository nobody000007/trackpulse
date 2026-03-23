import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { uploadBlob } from "@/backend/lib/blob-storage";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string; taskId: string } }
) {
  const assignment = await prisma.assignment.findUnique({ where: { token: params.token } });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File must be under 20 MB" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const blobName = `submissions/${assignment.id}/${params.taskId}/${Date.now()}-${file.name}`;
  const blobUrl = await uploadBlob(blobName, buffer, file.type);

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO submission_files (id, assignment_id, task_id, filename, blob_url, file_type, file_size, created_at)
    VALUES (${id}, ${assignment.id}, ${params.taskId}, ${file.name}, ${blobUrl}, ${file.type}, ${file.size}, NOW())
  `;

  return NextResponse.json({ id, filename: file.name, blobUrl, fileType: file.type, fileSize: file.size }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string; taskId: string } }
) {
  const assignment = await prisma.assignment.findUnique({ where: { token: params.token } });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { fileId } = await req.json();
  if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

  const rows = await prisma.$queryRaw<{ blob_url: string }[]>`
    SELECT blob_url FROM submission_files WHERE id = ${fileId} AND assignment_id = ${assignment.id}
  `;
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { deleteBlob } = await import("@/backend/lib/blob-storage");
    const url = new URL(rows[0].blob_url);
    const blobName = url.pathname.split("/").slice(2).join("/");
    await deleteBlob(blobName);
  } catch {}

  await prisma.$executeRaw`DELETE FROM submission_files WHERE id = ${fileId} AND assignment_id = ${assignment.id}`;
  return NextResponse.json({ ok: true });
}
