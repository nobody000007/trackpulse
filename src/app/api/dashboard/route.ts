import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { StatsService } from "@/backend/services/stats.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await StatsService.getDashboardStats(session.user.id);
  return NextResponse.json(stats);
}
