import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { AIService } from "@/backend/services/ai.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, employeeContext } = await req.json();
  if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

  const generated = await AIService.generatePlan(text, employeeContext);
  return NextResponse.json(generated);
}
