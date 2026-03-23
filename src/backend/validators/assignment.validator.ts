import { z } from "zod";

export const createAssignmentSchema = z.object({
  planId: z.string().cuid(),
  employeeId: z.string().cuid(),
});

export type CreateAssignmentSchema = z.infer<typeof createAssignmentSchema>;
