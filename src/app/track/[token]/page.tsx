import { AssignmentRepository } from "@/backend/repositories/assignment.repository";
import { notFound } from "next/navigation";
import { TrackingPageClient } from "@/frontend/components/tracking/tracking-page-client";
import { PasswordGate } from "@/frontend/components/tracking/password-gate";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

export default async function TrackPage({ params }: { params: { token: string } }) {
  const result = await AssignmentRepository.findByTokenWithDetails(params.token);
  if (!result) notFound();

  const { assignment, linkReadSeconds, statusNote, submissionByTaskId } = result;
  const data = JSON.parse(JSON.stringify(assignment));

  // Check password gate
  if (data.linkPassword) {
    const secret = process.env.NEXTAUTH_SECRET ?? "fallback";
    const expected = createHmac("sha256", secret).update(params.token).digest("hex");
    const cookieStore = cookies();
    const cookie = cookieStore.get(`tp_auth_${params.token}`);
    if (cookie?.value !== expected) {
      return (
        <PasswordGate
          token={params.token}
          employeeName={data.employee.name}
          planTitle={data.plan.title}
        />
      );
    }
  }

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
