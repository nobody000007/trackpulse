import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

/**
 * GET /api/track/[token]/link?url=<target>&taskId=<taskId>
 * Logs a LINK_CLICK event then redirects the employee to the target URL.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const taskId = searchParams.get("taskId");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Resolve assignment and log click (non-blocking, best-effort)
  if (taskId) {
    const assignment = await prisma.assignment.findFirst({ where: { token: params.token } });
    if (assignment) {
      prisma.trackingEvent.create({
        data: {
          assignmentId: assignment.id,
          taskId,
          eventType: "LINK_CLICK",
          userAgent: req.headers.get("user-agent") ?? undefined,
        },
      }).catch(() => {/* ignore */});
    }
  }

  return NextResponse.redirect(url);
}
