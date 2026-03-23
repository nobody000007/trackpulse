import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PlanService } from "@/backend/services/plan.service";
import { updatePlanSchema } from "@/backend/validators/plan.validator";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await PlanService.getById(params.id, session.user.id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = updatePlanSchema.parse(body);
  const plan = await PlanService.update(params.id, session.user.id, validated);

  return NextResponse.json(plan);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await PlanService.delete(params.id, session.user.id);
  return NextResponse.json({ success: true });
}
