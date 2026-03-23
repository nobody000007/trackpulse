import { PlanRepository } from "@/backend/repositories/plan.repository";
import { AIService } from "@/backend/services/ai.service";
import type { CreatePlanInput, UpdatePlanInput } from "@/shared/types/api";

export class PlanService {
  static async create(managerId: string, input: CreatePlanInput) {
    return PlanRepository.create({ ...input, managerId });
  }

  static async listByManager(managerId: string) {
    return PlanRepository.findByManager(managerId);
  }

  static async getById(planId: string, managerId: string) {
    return PlanRepository.findById(planId);
  }

  static async update(planId: string, managerId: string, input: UpdatePlanInput) {
    return PlanRepository.update(planId, input);
  }

  static async delete(planId: string, managerId: string) {
    return PlanRepository.delete(planId);
  }

  static async generateFromText(managerId: string, rawText: string) {
    return AIService.generatePlan(rawText);
  }
}
