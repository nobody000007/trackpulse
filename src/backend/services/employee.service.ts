import { EmployeeRepository } from "@/backend/repositories/employee.repository";
import type { CreateEmployeeInput } from "@/shared/types/api";

export class EmployeeService {
  static async create(managerId: string, input: CreateEmployeeInput) {
    return EmployeeRepository.create({ ...input, managerId });
  }

  static async listByManager(managerId: string) {
    return EmployeeRepository.findByManager(managerId);
  }

  static async getById(employeeId: string, managerId: string) {
    return EmployeeRepository.findById(employeeId);
  }

  static async delete(employeeId: string, managerId: string) {
    return EmployeeRepository.delete(employeeId);
  }
}
