import { prisma } from "@/backend/lib/prisma";
import { notFound } from "next/navigation";
import { TrackingPageClient } from "@/frontend/components/tracking/tracking-page-client";

export default async function TrackPage({ params }: { params: { token: string } }) {
  const assignment = await prisma.assignment.findUnique({
    where: { token: params.token },
    include: {
      employee: true,
      plan: {
        include: {
          phases: {
            include: {
              tasks: {
                include: { attachments: true },
                orderBy: { orderIndex: "asc" },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
      },
      progress: true,
    },
  });

  if (!assignment) notFound();

  const data = JSON.parse(JSON.stringify(assignment));

  // Fetch LINK_RETURN events via raw SQL (Prisma client may not have LINK_RETURN in enum yet).
  const rawEvents = await prisma.$queryRaw<{ task_id: string; read_time_sec: number | null }[]>`
    SELECT task_id, read_time_sec FROM tracking_events
    WHERE assignment_id = ${(assignment as any).id} AND event_type = 'LINK_RETURN'
  `;
  const linkReadSeconds: Record<string, number> = {};
  for (const e of rawEvents) {
    if (e.task_id && e.read_time_sec) {
      linkReadSeconds[e.task_id] = (linkReadSeconds[e.task_id] ?? 0) + e.read_time_sec;
    }
  }

  // Fetch statusNote via raw SQL
  const metaRows = await prisma.$queryRaw<{ status_note: string | null }[]>`
    SELECT status_note FROM assignments WHERE id = ${(assignment as any).id}
  `;
  const statusNote = metaRows[0]?.status_note ?? "";

  // Fetch submission data (new columns not in Prisma client)
  const submissionRows = await prisma.$queryRaw<{
    task_id: string; submission_url: string | null; submission_name: string | null;
  }[]>`
    SELECT task_id, submission_url, submission_name FROM task_progress
    WHERE assignment_id = ${(assignment as any).id}
      AND (submission_url IS NOT NULL OR submission_name IS NOT NULL)
  `;
  const submissionByTaskId = new Map(
    submissionRows.map((r) => [r.task_id, { submissionUrl: r.submission_url, submissionName: r.submission_name }])
  );

  // Merge submission data into progress array
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
