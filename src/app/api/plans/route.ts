import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PlanService } from "@/backend/services/plan.service";
import { createPlanSchema } from "@/backend/validators/plan.validator";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await PlanService.listByManager(session.user.id);
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = createPlanSchema.parse(body);
  const plan = await PlanService.create(session.user.id, validated);

  return NextResponse.json(plan, { status: 201 });
}
