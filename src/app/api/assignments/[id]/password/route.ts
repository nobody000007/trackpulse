import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();

  // Verify the assignment belongs to this manager
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: { plan: { select: { managerId: true } } },
  });

  if (!assignment || assignment.plan.managerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await prisma.assignment.update({
      where: { id: params.id },
      data: { linkPassword: hash },
    });
  } else {
    await prisma.assignment.update({
      where: { id: params.id },
      data: { linkPassword: null },
    });
  }

  return NextResponse.json({ success: true });
}
