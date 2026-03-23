import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/backend/services/tracking.service";
import { updateTaskProgressSchema } from "@/backend/validators/tracking.validator";

export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string; taskId: string } }
) {
  const body = await req.json();
  const validated = updateTaskProgressSchema.parse(body);
  const progress = await TrackingService.updateTaskProgress(params.token, params.taskId, validated);

  return NextResponse.json(progress);
}
