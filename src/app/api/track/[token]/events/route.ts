import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/backend/services/tracking.service";
import { trackingEventSchema } from "@/backend/validators/tracking.validator";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = await req.json();
  const validated = trackingEventSchema.parse(body);
  await TrackingService.recordEvent(params.token, validated);

  return NextResponse.json({ success: true }, { status: 201 });
}
