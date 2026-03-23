import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = updateSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = validated.data;
  const updates: Record<string, unknown> = {};

  if (name) updates.name = name;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const manager = await prisma.manager.findUnique({ where: { id: session.user.id } });
    if (!manager) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, manager.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "Nothing to update" });
  }

  const updated = await prisma.manager.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
