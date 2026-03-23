import type { AssignmentStatus } from "./enums";

export interface Employee {
  id: string;
  managerId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  planId: string;
  employeeId: string;
  token: string;
  status: AssignmentStatus;
  assignedAt: Date;
  employee?: Employee;
}
