import { NextRequest, NextResponse } from "next/server";
import { AssignmentService } from "@/backend/services/assignment.service";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const assignment = await AssignmentService.getByToken(params.token);
  if (!assignment) return NextResponse.json({ error: "Invalid token" }, { status: 404 });

  return NextResponse.json(assignment);
}
