import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/backend/services/ai.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assignmentId, send } = await req.json();
  const nudge = await AIService.generateNudge(assignmentId, send);

  return NextResponse.json(nudge);
}
