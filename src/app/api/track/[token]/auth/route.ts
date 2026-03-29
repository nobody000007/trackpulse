import { prisma } from "@/backend/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { password } = await req.json();

  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    select: { id: true, linkPassword: true },
  });

  if (!assignment?.linkPassword) {
    return NextResponse.json({ error: "No password set" }, { status: 400 });
  }

  const valid = await bcrypt.compare(password, assignment.linkPassword);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  // Create a signed cookie value so it can't be forged
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback";
  const cookieValue = createHmac("sha256", secret).update(params.token).digest("hex");

  const res = NextResponse.json({ success: true });
  res.cookies.set(`tp_auth_${params.token}`, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: `/track/${params.token}`,
  });

  return res;
}
