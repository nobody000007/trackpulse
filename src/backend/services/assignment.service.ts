import { AssignmentRepository } from "@/backend/repositories/assignment.repository";
import { sendMail } from "@/backend/lib/mailer";
import type { CreateAssignmentInput } from "@/shared/types/api";

export class AssignmentService {
  static async assign(managerId: string, input: CreateAssignmentInput) {
    const assignment = await AssignmentRepository.create(input);
    await AssignmentService.sendInviteEmail(assignment);
    return assignment;
  }

  static async getByToken(token: string) {
    return AssignmentRepository.findByToken(token);
  }

  static async revokeAssignment(assignmentId: string, managerId: string) {
    return AssignmentRepository.updateStatus(assignmentId, "REVOKED");
  }

  private static async sendInviteEmail(assignment: {
    id: string;
    token: string;
    employee: { name: string; email: string };
    plan: { title: string };
  }) {
    const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${assignment.token}`;

    await sendMail({
      to: assignment.employee.email,
      subject: `Your training plan is ready: ${assignment.plan.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${assignment.employee.name},</h2>
          <p>Your manager has assigned you a new training plan: <strong>${assignment.plan.title}</strong>.</p>
          <p>Click the button below to view your plan and track your progress:</p>
          <a href="${trackUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 16px 0;
          ">View My Plan</a>
          <p style="color: #666; font-size: 14px;">
            Or copy this link: <a href="${trackUrl}">${trackUrl}</a>
          </p>
        </div>
      `,
    });
  }
}
