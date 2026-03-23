import { z } from "zod";

export const trackingEventSchema = z.object({
  taskId: z.string().cuid(),
  eventType: z.enum(["OPEN", "HEARTBEAT", "SCROLL", "CLOSE", "LINK_CLICK", "LINK_RETURN"]),
  sessionId: z.string().optional(),
  readTimeSec: z.number().int().optional(),
  scrollDepthPct: z.number().min(0).max(100).optional(),
  userAgent: z.string().optional(),
});

export const updateTaskProgressSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  notes: z.string().optional(),
});

export type TrackingEventSchema = z.infer<typeof trackingEventSchema>;
export type UpdateTaskProgressSchema = z.infer<typeof updateTaskProgressSchema>;
