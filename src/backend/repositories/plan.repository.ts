import { prisma } from "@/backend/lib/prisma";
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
    return prisma.plan.delete({ where: { id: planId } });
  }
}
