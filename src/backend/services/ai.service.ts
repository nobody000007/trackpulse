import { groq } from "@/backend/lib/groq";
import { AssignmentRepository } from "@/backend/repositories/assignment.repository";
import { sendMail } from "@/backend/lib/mailer";
import type { GeneratedPlan } from "@/shared/types/api";

// Model used: llama-3.3-70b-versatile — free on Groq, very capable.
const MODEL = "llama-3.3-70b-versatile";

export class AIService {
  static async generatePlan(rawText: string, employeeContext?: { strengths?: string; weaknesses?: string; role?: string }): Promise<GeneratedPlan> {
    const contextNote = employeeContext
      ? `\n\nEmployee context to personalise the plan:
- Role: ${employeeContext.role ?? "Not specified"}
- Strengths: ${employeeContext.strengths ?? "Not specified"}
- Areas to improve: ${employeeContext.weaknesses ?? "Not specified"}
Use this to tailor task priorities and add targeted tasks that address weaknesses.`
      : "";

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert at creating structured employee training and onboarding plans.
Given a description of a role, job requirements, or training needs, generate a comprehensive structured plan as JSON.
Return ONLY valid JSON in this exact format — no extra text:
{
  "phases": [
    {
      "title": "Phase title",
      "tasks": [
        {
          "title": "Task title",
          "description": "Clear description of what needs to be done",
          "type": "ACTION|DOCUMENT|LINK",
          "priority": "LOW|MEDIUM|HIGH",
          "suggestedDays": 1,
          "url": null
        }
      ]
    }
  ]
}
Rules:
- Create 3-5 logical phases (e.g. Onboarding, Core Training, Advanced Skills, Evaluation)
- Each phase should have 3-6 tasks
- Use ACTION for tasks requiring active work, DOCUMENT for reading/reviewing, LINK for online resources
- Set priority based on importance and sequence
- CRITICAL: For every LINK type task, the "url" field MUST be a real, publicly accessible URL (e.g. https://docs.python.org/3/, https://www.youtube.com/watch?v=..., https://developer.mozilla.org/en-US/docs/...). NEVER leave "url" as null for a LINK task. Choose the most relevant real URL for the topic.
- For ACTION and DOCUMENT tasks, "url" should be null${contextNote}`,
        },
        { role: "user", content: rawText },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from AI");

    return JSON.parse(text);
  }

  static async generatePulseReport(assignmentId: string): Promise<string> {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing employee training progress. Generate a concise, actionable pulse report in 3-5 sentences.",
        },
        {
          role: "user",
          content: `Generate a pulse report for this assignment: ${JSON.stringify(assignment)}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content ?? "Unable to generate report.";
  }

  static async detectRisk(
    assignmentId: string
  ): Promise<{ level: "GREEN" | "YELLOW" | "RED"; reasoning: string }> {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 256,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Analyze employee training progress and return a risk level as JSON.
Return: { "level": "GREEN" | "YELLOW" | "RED", "reasoning": "one sentence explanation" }
GREEN = on track, YELLOW = falling behind, RED = overdue or no activity in 3+ days.`,
        },
        {
          role: "user",
          content: JSON.stringify(assignment),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return { level: "GREEN", reasoning: "Unable to assess." };

    return JSON.parse(text);
  }

  static async generateNudge(
    assignmentId: string,
    send: boolean
  ): Promise<{ subject: string; body: string }> {
    const assignment = await AssignmentRepository.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate a friendly, motivating email nudge for an employee who may be falling behind on training.
Return JSON: { "subject": "email subject line", "body": "HTML email body" }`,
        },
        {
          role: "user",
          content: `Employee: ${JSON.stringify(assignment)}. Generate a nudge email.`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from AI");

    const nudge: { subject: string; body: string } = JSON.parse(text);

    if (send) {
      const email = (assignment as any).employee?.email;
      if (!email) throw new Error("Employee email not found");
      await sendMail({ to: email, subject: nudge.subject, html: nudge.body });
    }

    return nudge;
  }
}
