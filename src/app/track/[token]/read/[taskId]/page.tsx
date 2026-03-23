import { prisma } from "@/backend/lib/prisma";
import { notFound } from "next/navigation";
import { ResourceReader } from "@/frontend/components/tracking/resource-reader";

interface ReadPageProps {
  params: { token: string; taskId: string };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    select: { id: true },
  });
  if (!assignment) notFound();

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    select: { id: true, title: true, url: true, description: true },
  });
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
