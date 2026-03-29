import { prisma } from "@/backend/lib/prisma";
import { deleteBlob } from "@/backend/lib/blob-storage";
import type { CreatePlanInput, UpdatePlanInput } from "@/shared/types/api";

export class PlanRepository {
  static async create(data: CreatePlanInput & { managerId: string }) {
    return prisma.plan.create({
      data: {
        title: data.title,
        description: data.description,
        managerId: data.managerId,
        phases: {
          create: (data.phases ?? []).map((phase, phaseIndex) => ({
            title: phase.title,
            orderIndex: phaseIndex,
            tasks: {
              create: (phase.tasks ?? []).map((task, taskIndex) => ({
                title: task.title,
                description: task.description,
                type: (task.type ?? "ACTION") as any,
                priority: (task.priority ?? "MEDIUM") as any,
                orderIndex: taskIndex,
                url: task.url ?? null,
                content: (task as any).content ?? null,
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              })),
            },
          })),
        },
      },
      include: {
        phases: { include: { tasks: true }, orderBy: { orderIndex: "asc" } },
      },
    });
  }

  static async findByManager(managerId: string) {
    return prisma.plan.findMany({
      where: { managerId },
      include: {
        phases: { include: { tasks: true }, orderBy: { orderIndex: "asc" } },
        assignments: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(planId: string) {
    return prisma.plan.findUnique({
      where: { id: planId },
      include: {
        phases: {
          include: { tasks: { include: { attachments: true }, orderBy: { orderIndex: "asc" } } },
          orderBy: { orderIndex: "asc" },
        },
        assignments: { include: { employee: true } },
      },
    });
  }

  static async update(planId: string, data: UpdatePlanInput) {
    return prisma.plan.update({
      where: { id: planId },
      data: { title: data.title, description: data.description },
    });
  }

  static async delete(planId: string) {
    // Fetch all blob URLs for attachments and submission files under this plan before deleting
    const attachments = await prisma.$queryRaw<{ blob_url: string }[]>`
      SELECT a.blob_url FROM attachments a
      JOIN tasks t ON t.id = a.task_id
      JOIN phases ph ON ph.id = t.phase_id
      WHERE ph.plan_id = ${planId}
    `;
    const subFiles = await prisma.$queryRaw<{ blob_url: string }[]>`
      SELECT sf.blob_url FROM submission_files sf
      JOIN assignments asgn ON asgn.id = sf.assignment_id
      WHERE asgn.plan_id = ${planId}
    `;

    // Delete blobs (non-fatal — DB delete proceeds regardless)
    const allUrls = [...attachments, ...subFiles].map((r) => r.blob_url);
    await Promise.allSettled(
      allUrls.map(async (url) => {
        try {
          const blobName = new URL(url).pathname.split("/").slice(2).join("/");
          await deleteBlob(blobName);
        } catch {}
      })
    );

    return prisma.plan.delete({ where: { id: planId } });
  }

  static async findTaskById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, url: true, description: true },
    });
  }
}
