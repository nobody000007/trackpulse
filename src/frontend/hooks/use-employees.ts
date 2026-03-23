"use client";
import { useState, useEffect } from "react";
import { api } from "@/frontend/lib/api-client";
import type { CreateEmployeeInput } from "@/shared/types/api";

export function useEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.employees
      .list()
      .then((data) => setEmployees(data as any[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function createEmployee(data: CreateEmployeeInput) {
    const employee = await api.employees.create(data);
    setEmployees((prev) => [employee as any, ...prev]);
    return employee;
  }

  async function deleteEmployee(id: string) {
    await api.employees.delete(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  return { employees, loading, error, createEmployee, deleteEmployee };
}
