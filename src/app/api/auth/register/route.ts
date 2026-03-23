import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/backend/lib/prisma";
import { registerSchema } from "@/backend/validators/auth.validator";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existing = await prisma.manager.findUnique({ where: { email: validated.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);
    const manager = await prisma.manager.create({
      data: { email: validated.email, name: validated.name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(manager, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 422 });
    }
    console.error("[register]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
