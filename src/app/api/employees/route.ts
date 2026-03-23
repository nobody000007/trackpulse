import { auth } from "@/backend/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/backend/services/employee.service";
import { createEmployeeSchema } from "@/backend/validators/employee.validator";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await EmployeeService.listByManager(session.user.id);
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = createEmployeeSchema.parse(body);
  const employee = await EmployeeService.create(session.user.id, validated);

  return NextResponse.json(employee, { status: 201 });
}
