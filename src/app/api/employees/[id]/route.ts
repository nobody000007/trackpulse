import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/backend/services/employee.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await EmployeeService.getById(params.id, session.user.id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(employee);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await EmployeeService.delete(params.id, session.user.id);
  return NextResponse.json({ success: true });
}
