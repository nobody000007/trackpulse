import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.string().max(200).optional(),
  strengths: z.string().max(1000).optional(),
  weaknesses: z.string().max(1000).optional(),
});

export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
