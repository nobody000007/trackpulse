import { AssignmentRepository } from "@/backend/repositories/assignment.repository";
import { PlanRepository } from "@/backend/repositories/plan.repository";
import { notFound } from "next/navigation";
import { ResourceReader } from "@/frontend/components/tracking/resource-reader";

interface ReadPageProps {
  params: { token: string; taskId: string };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const assignment = await AssignmentRepository.findTokenExists(params.token);
  if (!assignment) notFound();

  const task = await PlanRepository.findTaskById(params.taskId);
  if (!task || !task.url) notFound();

  return (
    <ResourceReader
      token={params.token}
      taskId={task.id}
      taskTitle={task.title}
      taskDescription={task.description ?? null}
      url={task.url}
    />
  );
}
