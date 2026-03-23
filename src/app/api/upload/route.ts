import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { UploadService } from "@/backend/services/upload.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const taskId = formData.get("taskId") as string;

  if (!file || !taskId) return NextResponse.json({ error: "File and taskId required" }, { status: 400 });

  const attachment = await UploadService.uploadFile(file, taskId);
  return NextResponse.json(attachment, { status: 201 });
}
