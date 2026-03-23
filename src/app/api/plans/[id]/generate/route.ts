import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PlanService } from "@/backend/services/plan.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

  const generated = await PlanService.generateFromText(session.user.id, text);
  return NextResponse.json(generated);
}
