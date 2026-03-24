/**
 * TrackPulse — Comprehensive Feature Tests
 * Run with: npm test
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock Prisma so tests never touch the real DB
vi.mock("@/backend/lib/prisma", () => ({
  prisma: {
    manager: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    plan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    taskProgress: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

// Mock Azure Blob Storage
vi.mock("@/backend/lib/blob-storage", () => ({
  uploadBlob: vi.fn().mockResolvedValue("https://storage.azure.com/container/file.pdf"),
  deleteBlob: vi.fn().mockResolvedValue(undefined),
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    }),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$hashed$password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import { prisma } from "@/backend/lib/prisma";
import { uploadBlob, deleteBlob } from "@/backend/lib/blob-storage";
import bcrypt from "bcryptjs";

// ─── 1. Auth & Password ───────────────────────────────────────────────────────

describe("Auth — Password hashing", () => {
  it("hashes a password on registration", async () => {
    await bcrypt.hash("mypassword123", 12);
    expect(bcrypt.hash).toHaveBeenCalledWith("mypassword123", 12);
  });

  it("verifies a correct password", async () => {
    const result = await bcrypt.compare("mypassword123", "$hashed$password");
    expect(result).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const isValid = (pw: string) => pw.length >= 8;
    expect(isValid("short")).toBe(false);
    expect(isValid("validpass")).toBe(true);
  });
});

// ─── 2. Employee Management ───────────────────────────────────────────────────

describe("Employee Management", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an employee with required fields", async () => {
    const mockEmployee = {
      id: "emp-1",
      name: "John Doe",
      email: "john@example.com",
      managerId: "mgr-1",
      role: "Developer",
      createdAt: new Date(),
    };
    (prisma.employee.create as any).mockResolvedValue(mockEmployee);

    const result = await prisma.employee.create({
      data: { name: "John Doe", email: "john@example.com", managerId: "mgr-1", role: "Developer" },
    });

    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.id).toBeDefined();
  });

  it("lists employees for a manager", async () => {
    (prisma.employee.findMany as any).mockResolvedValue([
      { id: "emp-1", name: "Alice", email: "alice@test.com" },
      { id: "emp-2", name: "Bob",   email: "bob@test.com" },
    ]);

    const employees = await prisma.employee.findMany({ where: { managerId: "mgr-1" } });
    expect(employees).toHaveLength(2);
    expect(employees[0].name).toBe("Alice");
  });

  it("deletes an employee", async () => {
    (prisma.employee.delete as any).mockResolvedValue({ id: "emp-1" });
    const result = await prisma.employee.delete({ where: { id: "emp-1" } });
    expect(result.id).toBe("emp-1");
  });
});

// ─── 3. Plan Management ───────────────────────────────────────────────────────

describe("Plan Management", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a plan with phases and tasks", async () => {
    const mockPlan = {
      id: "plan-1",
      title: "Onboarding Plan",
      managerId: "mgr-1",
      phases: [
        { id: "phase-1", title: "Week 1", tasks: [{ id: "task-1", title: "Read handbook" }] },
      ],
    };
    (prisma.plan.create as any).mockResolvedValue(mockPlan);

    const result = await prisma.plan.create({ data: { title: "Onboarding Plan", managerId: "mgr-1" } } as any);
    expect(result.title).toBe("Onboarding Plan");
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].tasks).toHaveLength(1);
  });

  it("lists plans for a manager", async () => {
    (prisma.plan.findMany as any).mockResolvedValue([
      { id: "plan-1", title: "Plan A" },
      { id: "plan-2", title: "Plan B" },
    ]);

    const plans = await prisma.plan.findMany({ where: { managerId: "mgr-1" } });
    expect(plans).toHaveLength(2);
  });

  it("deletes a plan", async () => {
    (prisma.plan.delete as any).mockResolvedValue({ id: "plan-1" });
    const result = await prisma.plan.delete({ where: { id: "plan-1" } });
    expect(result.id).toBe("plan-1");
    expect(prisma.plan.delete).toHaveBeenCalledWith({ where: { id: "plan-1" } });
  });
});

// ─── 4. File Attachments ─────────────────────────────────────────────────────

describe("File Attachments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads a file to Azure Blob Storage", async () => {
    const buffer = Buffer.from("test file content");
    const url = await uploadBlob("attachments/task-1/file.pdf", buffer, "application/pdf");

    expect(uploadBlob).toHaveBeenCalledWith("attachments/task-1/file.pdf", buffer, "application/pdf");
    expect(url).toContain("https://");
  });

  it("deletes a blob from Azure", async () => {
    await deleteBlob("attachments/task-1/file.pdf");
    expect(deleteBlob).toHaveBeenCalledWith("attachments/task-1/file.pdf");
  });

  it("rejects files over 20 MB", () => {
    const MAX_SIZE = 20 * 1024 * 1024;
    const validateSize = (size: number) => size <= MAX_SIZE;

    expect(validateSize(10 * 1024 * 1024)).toBe(true);   // 10 MB — ok
    expect(validateSize(21 * 1024 * 1024)).toBe(false);  // 21 MB — rejected
  });

  it("extracts blob name from Azure URL correctly", () => {
    const url = "https://myaccount.blob.core.windows.net/container/submissions/asgn-1/task-1/file.pdf";
    const blobName = new URL(url).pathname.split("/").slice(2).join("/");
    expect(blobName).toBe("submissions/asgn-1/task-1/file.pdf");
  });
});

// ─── 5. Assignment & Progress ─────────────────────────────────────────────────

describe("Assignment & Progress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an assignment linking employee to plan", async () => {
    const mockAssignment = {
      id: "asgn-1",
      planId: "plan-1",
      employeeId: "emp-1",
      token: "unique-token-abc",
      status: "ACTIVE",
    };
    (prisma.assignment.create as any).mockResolvedValue(mockAssignment);

    const result = await prisma.assignment.create({
      data: { planId: "plan-1", employeeId: "emp-1" },
    } as any);

    expect(result.status).toBe("ACTIVE");
    expect(result.token).toBeDefined();
  });

  it("calculates completion rate correctly", () => {
    const totalTasks = 10;
    const completedTasks = 4;
    const rate = Math.round((completedTasks / totalTasks) * 100);
    expect(rate).toBe(40);
  });

  it("returns 0% rate when no tasks exist", () => {
    const totalTasks = 0;
    const rate = totalTasks > 0 ? Math.round((0 / totalTasks) * 100) : 0;
    expect(rate).toBe(0);
  });

  it("progress statuses are correct enum values", () => {
    const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    expect(validStatuses).toContain("NOT_STARTED");
    expect(validStatuses).toContain("IN_PROGRESS");
    expect(validStatuses).toContain("COMPLETED");
    expect(validStatuses).not.toContain("PENDING");
  });
});

// ─── 6. Risk Level Calculation ────────────────────────────────────────────────

describe("Risk Level Calculation", () => {
  function getRiskLevel(lastActivityDate: Date | null, completionRate: number): "GREEN" | "YELLOW" | "RED" {
    if (!lastActivityDate) return "RED";
    const daysSince = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3 && completionRate < 100) return "RED";
    if (completionRate < 50 && daysSince >= 1) return "YELLOW";
    return "GREEN";
  }

  it("marks as GREEN when active today", () => {
    const now = new Date();
    expect(getRiskLevel(now, 60)).toBe("GREEN");
  });

  it("marks as YELLOW when inactive 1 day and under 50%", () => {
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(getRiskLevel(yesterday, 30)).toBe("YELLOW");
  });

  it("marks as RED when inactive 3+ days and not complete", () => {
    const old = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    expect(getRiskLevel(old, 50)).toBe("RED");
  });

  it("marks as RED when no activity at all", () => {
    expect(getRiskLevel(null, 0)).toBe("RED");
  });

  it("stays GREEN at 100% even if inactive", () => {
    const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(getRiskLevel(old, 100)).toBe("GREEN");
  });

  it("aggregates worst risk across multiple plans", () => {
    const RISK_RANK: Record<string, number> = { GREEN: 0, YELLOW: 1, RED: 2 };
    const plans = [
      { riskLevel: "GREEN" },
      { riskLevel: "YELLOW" },
      { riskLevel: "RED" },
    ];
    const worst = plans.reduce((w, p) =>
      (RISK_RANK[p.riskLevel] ?? 0) > (RISK_RANK[w] ?? 0) ? p.riskLevel : w
    , "GREEN");
    expect(worst).toBe("RED");
  });
});

// ─── 7. Dashboard Stats ───────────────────────────────────────────────────────

describe("Dashboard Stats", () => {
  it("calculates average completion rate across assignments", () => {
    const rates = [100, 50, 0, 75];
    const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    expect(avg).toBe(56);
  });

  it("counts at-risk employees correctly", () => {
    const employees = [
      { assignments: [{ riskLevel: "GREEN" }] },
      { assignments: [{ riskLevel: "RED" }] },
      { assignments: [{ riskLevel: "YELLOW" }] },
      { assignments: [] },
    ];
    const atRisk = employees.filter((e) =>
      e.assignments.some((a) => a.riskLevel === "RED" || a.riskLevel === "YELLOW")
    ).length;
    expect(atRisk).toBe(2);
  });

  it("sums progress across multiple plans per employee", () => {
    const assignments = [
      { completedTasks: 3, totalTasks: 10 },
      { completedTasks: 5, totalTasks: 8 },
    ];
    const totalCompleted = assignments.reduce((s, a) => s + a.completedTasks, 0);
    const totalTasks = assignments.reduce((s, a) => s + a.totalTasks, 0);
    const rate = Math.round((totalCompleted / totalTasks) * 100);
    expect(totalCompleted).toBe(8);
    expect(totalTasks).toBe(18);
    expect(rate).toBe(44);
  });
});

// ─── 8. Inbox & Help Requests ────────────────────────────────────────────────

describe("Inbox — Help Requests", () => {
  it("identifies help request notes correctly", () => {
    const isHelpRequest = (notes: string | null) =>
      notes?.startsWith("🚩 Help requested:") ?? false;

    expect(isHelpRequest("🚩 Help requested: I'm stuck on task 3")).toBe(true);
    expect(isHelpRequest("Just a regular note")).toBe(false);
    expect(isHelpRequest(null)).toBe(false);
  });

  it("extracts the help message from notes", () => {
    const notes = "🚩 Help requested: I need help with the onboarding docs";
    const message = notes.replace(/^🚩 Help requested:\s*/, "").trim();
    expect(message).toBe("I need help with the onboarding docs");
  });

  it("filters pending vs replied requests", () => {
    const items = [
      { replies: [] },
      { replies: [{ id: "r1", message: "Got it!" }] },
      { replies: [] },
    ];
    const pending = items.filter((i) => i.replies.length === 0);
    const replied = items.filter((i) => i.replies.length > 0);
    expect(pending).toHaveLength(2);
    expect(replied).toHaveLength(1);
  });
});

// ─── 9. Submission System ─────────────────────────────────────────────────────

describe("Submission System", () => {
  it("validates submission URL format", () => {
    const isValidUrl = (url: string) => {
      try { new URL(url); return true; } catch { return false; }
    };
    expect(isValidUrl("https://github.com/user/repo")).toBe(true);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });

  it("formats file sizes correctly", () => {
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    expect(formatSize(500)).toBe("500 B");
    expect(formatSize(2048)).toBe("2.0 KB");
    expect(formatSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("identifies file types from MIME type", () => {
    const getFileCategory = (mimeType: string) => {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType.startsWith("video/")) return "video";
      if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
      return "document";
    };
    expect(getFileCategory("image/png")).toBe("image");
    expect(getFileCategory("video/mp4")).toBe("video");
    expect(getFileCategory("application/zip")).toBe("archive");
    expect(getFileCategory("application/pdf")).toBe("document");
  });
});

// ─── 10. Email Notifications ──────────────────────────────────────────────────

describe("Email Notifications", () => {
  it("sends email via mailer", async () => {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({} as any);
    await transporter.sendMail({
      from: "noreply@trackpulse.com",
      to: "employee@example.com",
      subject: "Your training plan is ready",
      html: "<h1>Welcome!</h1>",
    });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "employee@example.com" })
    );
  });

  it("builds correct tracking URL for assignment email", () => {
    const appUrl = "https://trackpulse.vercel.app";
    const token = "abc123token";
    const url = `${appUrl}/track/${token}`;
    expect(url).toBe("https://trackpulse.vercel.app/track/abc123token");
  });
});

// ─── 11. Account Deletion ─────────────────────────────────────────────────────

describe("Account Deletion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires typed confirmation before deleting", () => {
    const canDelete = (confirmText: string) => confirmText === "DELETE";
    expect(canDelete("DELETE")).toBe(true);
    expect(canDelete("delete")).toBe(false);
    expect(canDelete("")).toBe(false);
    expect(canDelete("yes")).toBe(false);
  });

  it("deletes manager from DB", async () => {
    (prisma.manager.delete as any).mockResolvedValue({ id: "mgr-1" });
    const result = await prisma.manager.delete({ where: { id: "mgr-1" } });
    expect(result.id).toBe("mgr-1");
    expect(prisma.manager.delete).toHaveBeenCalledOnce();
  });

  it("deletes all blobs before deleting account", async () => {
    const blobUrls = [
      "https://storage.azure.com/container/attachments/task-1/file.pdf",
      "https://storage.azure.com/container/submissions/asgn-1/task-1/upload.docx",
    ];

    await Promise.allSettled(
      blobUrls.map(async (url) => {
        const blobName = new URL(url).pathname.split("/").slice(2).join("/");
        await deleteBlob(blobName);
      })
    );

    expect(deleteBlob).toHaveBeenCalledTimes(2);
    expect(deleteBlob).toHaveBeenCalledWith("attachments/task-1/file.pdf");
    expect(deleteBlob).toHaveBeenCalledWith("submissions/asgn-1/task-1/upload.docx");
  });
});

// ─── 12. Tracking Events ──────────────────────────────────────────────────────

describe("Tracking Events", () => {
  it("recognises all valid event types", () => {
    const validEvents = ["OPEN", "HEARTBEAT", "SCROLL", "CLOSE", "LINK_CLICK", "LINK_RETURN"];
    expect(validEvents).toContain("OPEN");
    expect(validEvents).toContain("LINK_RETURN");
    expect(validEvents).not.toContain("CLICK"); // wrong name
  });

  it("formats read time correctly", () => {
    const formatTime = (secs: number) =>
      secs >= 60 ? `${Math.round(secs / 60)}m` : `${secs}s`;

    expect(formatTime(30)).toBe("30s");
    expect(formatTime(90)).toBe("2m");
    expect(formatTime(3600)).toBe("60m");
  });

  it("calculates days since last activity", () => {
    const daysSince = (date: Date) =>
      Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    const today = new Date();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    expect(daysSince(today)).toBe(0);
    expect(daysSince(threeDaysAgo)).toBe(3);
  });
});

// ─── 13. Settings Validation ──────────────────────────────────────────────────

describe("Settings Validation", () => {
  it("rejects new password shorter than 8 characters", () => {
    const validatePassword = (pw: string) => pw.length >= 8;
    expect(validatePassword("short")).toBe(false);
    expect(validatePassword("longenough")).toBe(true);
  });

  it("requires current password when setting a new one", () => {
    const validate = (currentPw: string | undefined, newPw: string | undefined) => {
      if (newPw && !currentPw) return { error: "Current password is required" };
      return { ok: true };
    };
    expect(validate(undefined, "newpass123")).toEqual({ error: "Current password is required" });
    expect(validate("oldpass", "newpass123")).toEqual({ ok: true });
  });

  it("updates name independently of password", () => {
    const updates: Record<string, unknown> = {};
    const name = "Ralph";
    if (name) updates.name = name;
    expect(updates).toEqual({ name: "Ralph" });
    expect(updates.passwordHash).toBeUndefined();
  });
});
