import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["ACTION", "DOCUMENT", "LINK"]).default("ACTION"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  url: z.string().url().optional(),
  content: z.string().optional(),
  orderIndex: z.number().int().default(0),
});

export const createPhaseSchema = z.object({
  title: z.string().min(1),
  orderIndex: z.number().int().default(0),
  tasks: z.array(createTaskSchema).default([]),
});

export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  phases: z.array(createPhaseSchema).default([]),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanSchema = z.infer<typeof createPlanSchema>;
export type UpdatePlanSchema = z.infer<typeof updatePlanSchema>;
