import { AssignmentRepository } from "@/backend/repositories/assignment.repository";
import { notFound } from "next/navigation";
import { TrackingPageClient } from "@/frontend/components/tracking/tracking-page-client";

export default async function TrackPage({ params }: { params: { token: string } }) {
  const result = await AssignmentRepository.findByTokenWithDetails(params.token);
  if (!result) notFound();

  const { assignment, linkReadSeconds, statusNote, submissionByTaskId } = result;
  const data = JSON.parse(JSON.stringify(assignment));

  const progressWithSubmissions = data.progress.map((p: any) => ({
    ...p,
    ...(submissionByTaskId.get(p.taskId) ?? {}),
  }));

  return (
    <TrackingPageClient
      token={params.token}
      employeeName={data.employee.name}
      planTitle={data.plan.title}
      phases={data.plan.phases}
      progress={progressWithSubmissions}
      linkReadSeconds={linkReadSeconds}
      statusNote={statusNote}
    />
  );
}
