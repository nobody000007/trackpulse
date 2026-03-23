import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { AssignmentService } from "@/backend/services/assignment.service";
import { createAssignmentSchema } from "@/backend/validators/assignment.validator";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = createAssignmentSchema.parse(body);
  const assignment = await AssignmentService.assign(session.user.id, validated);

  return NextResponse.json(assignment, { status: 201 });
}
