import type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateEmployeeInput,
  CreateAssignmentInput,
  TrackingEventInput,
  UpdateTaskProgressInput,
  GeneratedPlan,
  DashboardData,
} from "@/shared/types/api";

class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || error.error || "API Error");
    }
    return res.json();
  }

  plans = {
    list: () => this.request<unknown[]>("/api/plans"),
    create: (data: CreatePlanInput) =>
      this.request<unknown>("/api/plans", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => this.request<unknown>(`/api/plans/${id}`),
    update: (id: string, data: UpdatePlanInput) =>
      this.request<unknown>(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/plans/${id}`, { method: "DELETE" }),
  };

  employees = {
    list: () => this.request<unknown[]>("/api/employees"),
    get: (id: string) => this.request<unknown>(`/api/employees/${id}`),
    create: (data: CreateEmployeeInput) =>
      this.request<unknown>("/api/employees", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/api/employees/${id}`, { method: "DELETE" }),
  };

  assignments = {
    create: (data: CreateAssignmentInput) =>
      this.request<unknown>("/api/assignments", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => this.request<unknown>(`/api/assignments/${id}`),
  };

  dashboard = {
    overview: () => this.request<DashboardData>("/api/dashboard"),
  };

  ai = {
    generatePlan: (text: string, employeeContext?: { strengths?: string; weaknesses?: string; role?: string }) =>
      this.request<GeneratedPlan>("/api/ai/generate-plan", {
        method: "POST",
        body: JSON.stringify({ text, employeeContext }),
      }),
    pulseReport: (assignmentId: string) =>
      this.request<{ report: string }>("/api/ai/pulse-report", {
        method: "POST",
        body: JSON.stringify({ assignmentId }),
      }),
    nudge: (assignmentId: string, send = false) =>
      this.request<{ subject: string; body: string }>("/api/ai/nudge", {
        method: "POST",
        body: JSON.stringify({ assignmentId, send }),
      }),
  };

  track = {
    getAssignment: (token: string) => this.request<unknown>(`/api/track/${token}`),
    sendEvent: (token: string, data: TrackingEventInput) =>
      this.request<{ success: boolean }>(`/api/track/${token}/events`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateTaskProgress: (token: string, taskId: string, data: UpdateTaskProgressInput) =>
      this.request<unknown>(`/api/track/${token}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  };
}

export const api = new ApiClient();
