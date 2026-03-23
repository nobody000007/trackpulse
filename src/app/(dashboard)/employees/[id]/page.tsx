import { auth } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { Prisma } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Briefcase, Star, BookOpen,
  CheckCircle2, Clock, TrendingUp, AlertTriangle, Calendar, MessageSquare
} from "lucide-react";
import { EmployeeActions } from "@/frontend/components/employees/employee-actions";
import { VelocityChart } from "@/frontend/components/employees/velocity-chart";
import { ManagerReplyPanel } from "@/frontend/components/employees/manager-reply-panel";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      assignments: {
        where: { status: "ACTIVE" },
        include: {
          plan: {
            include: {
              phases: {
                include: { tasks: { orderBy: { orderIndex: "asc" } } },
                orderBy: { orderIndex: "asc" },
              },
            },
          },
          progress: { include: { task: { select: { id: true, title: true, type: true } } } },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!emp || emp.managerId !== session.user.id) notFound();

  // Fetch statusNote and LINK_RETURN events via raw SQL (Prisma client may lag behind schema).
  const assignmentIds = emp.assignments.map((a) => a.id);
  const idList = assignmentIds.length > 0 ? Prisma.join(assignmentIds) : null;
  const [rawNotes, rawLinkEvents, rawAllEvents, rawSubmissions] = idList
    ? await Promise.all([
        prisma.$queryRaw<{ id: string; status_note: string | null; status_note_at: Date | null }[]>`
          SELECT id, status_note, status_note_at FROM assignments WHERE id IN (${idList})
        `,
        prisma.$queryRaw<{ assignment_id: string; task_id: string; read_time_sec: number | null }[]>`
          SELECT assignment_id, task_id, read_time_sec FROM tracking_events
          WHERE assignment_id IN (${idList}) AND event_type = 'LINK_RETURN'
        `,
        prisma.$queryRaw<{ id: string; assignment_id: string; task_id: string; event_type: string; read_time_sec: number | null; timestamp: Date }[]>`
          SELECT id, assignment_id, task_id, event_type, read_time_sec, timestamp
          FROM tracking_events
          WHERE assignment_id IN (${idList})
          ORDER BY timestamp DESC
        `,
        prisma.$queryRaw<{ assignment_id: string; task_id: string; submission_url: string | null; submission_name: string | null; submitted_at: Date | null }[]>`
          SELECT assignment_id, task_id, submission_url, submission_name, submitted_at
          FROM task_progress
          WHERE assignment_id IN (${idList})
            AND (submission_url IS NOT NULL OR submission_name IS NOT NULL)
        `,
      ])
    : [[], [], [], []];

  const notesByAssignmentId = new Map(rawNotes.map((r) => [r.id, r]));

  // Build per-assignment, per-task link read seconds from raw LINK_RETURN events
  const linkSecsByAssignment = new Map<string, Map<string, number>>();
  for (const e of rawLinkEvents) {
    if (!e.read_time_sec) continue;
    if (!linkSecsByAssignment.has(e.assignment_id)) linkSecsByAssignment.set(e.assignment_id, new Map());
    const taskMap = linkSecsByAssignment.get(e.assignment_id)!;
    taskMap.set(e.task_id, (taskMap.get(e.task_id) ?? 0) + e.read_time_sec);
  }

  // Group all events by assignment ID
  const eventsByAssignment = new Map<string, typeof rawAllEvents>();
  for (const e of rawAllEvents) {
    if (!eventsByAssignment.has(e.assignment_id)) eventsByAssignment.set(e.assignment_id, []);
    eventsByAssignment.get(e.assignment_id)!.push(e);
  }

  // Build submission map: assignmentId -> taskId -> submission data
  const submissionsByAssignment = new Map<string, Map<string, { submissionUrl: string | null; submissionName: string | null; submittedAt: Date | null }>>();
  for (const s of rawSubmissions) {
    if (!submissionsByAssignment.has(s.assignment_id)) submissionsByAssignment.set(s.assignment_id, new Map());
    submissionsByAssignment.get(s.assignment_id)!.set(s.task_id, {
      submissionUrl: s.submission_url,
      submissionName: s.submission_name,
      submittedAt: s.submitted_at,
    });
  }

  const initials = emp.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const totalTasksAll = emp.assignments.reduce(
    (acc, a) => acc + a.plan.phases.reduce((s, p) => s + p.tasks.length, 0), 0
  );
  const completedAll = emp.assignments.reduce(
    (acc, a) => acc + a.progress.filter((p) => p.status === "COMPLETED").length, 0
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href="/employees" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      <div className="grid grid-cols-3 gap-6 items-start">
        {/* ── Left: profile card ── */}
        <div className="space-y-4">
          {/* Avatar + info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-indigo-500 to-violet-600" />
            <div className="px-6 pb-6 -mt-8">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-indigo-700 text-xl font-bold mb-3">
                {initials}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{emp.name}</h1>
              {(emp as any).role && (
                <p className="text-sm text-indigo-600 font-medium mt-0.5">{(emp as any).role}</p>
              )}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" /> {emp.email}
                </div>
                {(emp as any).role && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-gray-400 shrink-0" /> {(emp as any).role}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Plans", value: emp.assignments.length, color: "text-indigo-600" },
              { label: "Tasks", value: totalTasksAll, color: "text-violet-600" },
              { label: "Done", value: completedAll, color: "text-emerald-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Profile */}
          {((emp as any).strengths || (emp as any).weaknesses) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" /> AI Profile
              </p>
              {(emp as any).strengths && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Strengths
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{(emp as any).strengths}</p>
                </div>
              )}
              {(emp as any).weaknesses && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Areas to Improve
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{(emp as any).weaknesses}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: assignments ── */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Training Plans</h2>
            <Link
              href="/plans"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Assign a plan →
            </Link>
          </div>

          {emp.assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-700 mb-1">No plans assigned yet</p>
              <p className="text-sm text-gray-400 mb-5 max-w-xs">
                Go to Plans, open any plan, and assign {emp.name.split(" ")[0]} to start tracking their progress.
              </p>
              <Link
                href="/plans"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Browse Plans
              </Link>
            </div>
          ) : (
            emp.assignments.map((assignment) => {
              const totalTasks = assignment.plan.phases.reduce((s, p) => s + p.tasks.length, 0);
              const completedTasks = assignment.progress.filter((p) => p.status === "COMPLETED").length;
              const inProgressTasks = assignment.progress.filter((p) => p.status === "IN_PROGRESS").length;
              const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const assignmentEvents = eventsByAssignment.get(assignment.id) ?? [];
              const lastEvent = assignmentEvents[0];
              const daysSince = lastEvent
                ? Math.floor((Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const risk: "GREEN" | "YELLOW" | "RED" =
                daysSince === null ? "YELLOW" : daysSince >= 3 ? "RED" : daysSince >= 1 ? "YELLOW" : "GREEN";

              const openCount = assignmentEvents.filter((e) => e.event_type === "OPEN").length;
              const linkClicks = assignmentEvents.filter((e) => e.event_type === "LINK_CLICK").length;
              const totalRead = assignmentEvents.reduce((acc, e) => acc + (e.read_time_sec ?? 0), 0);
              // Use raw-fetched LINK_RETURN events for accurate link read time
              const linkReadByTask = linkSecsByAssignment.get(assignment.id) ?? new Map<string, number>();
              const linkReadSec = Array.from(linkReadByTask.values()).reduce((a, b) => a + b, 0);
              const noteData = notesByAssignmentId.get(assignment.id);
              const submissionsByTask = submissionsByAssignment.get(assignment.id) ?? new Map();
              const helpTasks = assignment.progress
                .filter((p) => p.notes?.startsWith("🚩 Help requested:"))
                .map((p) => ({
                  taskId: p.task.id,
                  taskTitle: p.task.title,
                  message: p.notes!.replace("🚩 Help requested: ", ""),
                }));

              const riskStyles = {
                GREEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
                YELLOW: "bg-amber-50 text-amber-700 border-amber-200",
                RED: "bg-red-50 text-red-700 border-red-200",
              };
              const riskLabels = { GREEN: "On Track", YELLOW: "Needs Attention", RED: "At Risk" };

              return (
                <div key={assignment.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className={`h-1 ${risk === "GREEN" ? "bg-emerald-400" : risk === "YELLOW" ? "bg-amber-400" : "bg-red-500"}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">{assignment.plan.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Assigned {new Date(assignment.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${riskStyles[risk]}`}>
                          {riskLabels[risk]}
                        </span>
                        {/* Client actions: copy link, view stats */}
                        <EmployeeActions
                          token={assignment.token}
                          planId={assignment.plan.id}
                          assignmentId={assignment.id}
                        />
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>{completedTasks} of {totalTasks} tasks completed</span>
                        <span className="font-semibold text-gray-900">{rate}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${rate === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    {/* Help requests + reply panel */}
                    {helpTasks.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                            🚩 {helpTasks.length} help request{helpTasks.length > 1 ? "s" : ""} pending
                          </p>
                          <ManagerReplyPanel
                            assignmentId={assignment.id}
                            helpTasks={helpTasks}
                          />
                        </div>
                      </div>
                    )}

                    {/* Employee general status note */}
                    {noteData?.status_note && (
                      <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex gap-2.5">
                        <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-indigo-700 mb-0.5">Employee update</p>
                          <p className="text-sm text-gray-700 leading-snug">{noteData.status_note}</p>
                          {noteData.status_note_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(noteData.status_note_at).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Engagement stats */}
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {[
                        { label: "Opens", value: openCount },
                        { label: "Link clicks", value: linkClicks },
                        { label: "Doc read time", value: linkReadSec > 0 ? (linkReadSec >= 60 ? `${Math.round(linkReadSec / 60)}m` : `${linkReadSec}s`) : "—" },
                        { label: "In progress", value: inProgressTasks },
                        { label: "Total read time", value: totalRead > 60 ? `${Math.round(totalRead / 60)}m` : `${totalRead}s` },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {lastEvent && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                        <Clock className="w-3 h-3" />
                        Last interaction: {new Date(lastEvent.timestamp).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                        })}
                        {daysSince === 0 ? " (today)" : daysSince === 1 ? " (yesterday)" : daysSince !== null ? ` (${daysSince}d ago)` : ""}
                      </div>
                    )}

                    {/* Learning velocity chart */}
                    <div className="mb-4 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="text-xs font-semibold text-gray-700">Learning Velocity</p>
                        <span className="text-xs text-gray-400">(tasks/day vs team)</span>
                      </div>
                      <VelocityChart assignmentId={assignment.id} planId={assignment.plan.id} />
                    </div>
                  </div>

                  {/* Phases + tasks */}
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {assignment.plan.phases.map((phase) => {
                      const phaseDone = phase.tasks.filter((t) =>
                        assignment.progress.find((p) => p.task.id === t.id && p.status === "COMPLETED")
                      ).length;
                      const phaseTotal = phase.tasks.length;
                      const phaseRate = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

                      return (
                        <div key={phase.id} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-700">{phase.title}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{phaseDone}/{phaseTotal}</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${phaseRate}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {phase.tasks.map((task) => {
                              const prog = assignment.progress.find((p) => p.task.id === task.id);
                              const status = prog?.status ?? "NOT_STARTED";
                              return (
                                <div key={task.id} className="flex items-center gap-2.5 text-xs group">
                                  <span className={
                                    status === "COMPLETED" ? "text-emerald-500" :
                                    status === "IN_PROGRESS" ? "text-blue-500" : "text-gray-300"
                                  }>
                                    {status === "COMPLETED" ? "✓" : status === "IN_PROGRESS" ? "●" : "○"}
                                  </span>
                                  <span className={`flex-1 ${
                                    status === "COMPLETED" ? "line-through text-gray-400" :
                                    status === "IN_PROGRESS" ? "text-blue-700 font-medium" : "text-gray-700"
                                  }`}>
                                    {task.title}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs border ${
                                    task.type === "ACTION" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    task.type === "DOCUMENT" ? "bg-purple-50 text-purple-600 border-purple-100" :
                                    "bg-cyan-50 text-cyan-600 border-cyan-100"
                                  }`}>
                                    {task.type}
                                  </span>
                                  {(() => {
                                    const secs = linkReadByTask.get(task.id) ?? 0;
                                    if (!secs) return null;
                                    return (
                                      <span className="flex items-center gap-0.5 text-amber-600 font-medium" title="Time spent reading the linked resource">
                                        <Clock className="w-3 h-3" />
                                        {secs >= 60 ? `${Math.round(secs / 60)}m` : `${secs}s`}
                                      </span>
                                    );
                                  })()}
                                  {prog?.notes?.startsWith("🚩 Help requested:") && (
                                    <span title={prog.notes} className="flex items-center gap-0.5 text-red-500 font-semibold text-xs">
                                      🚩 Help needed
                                    </span>
                                  )}
                                  {(() => {
                                    const sub = submissionsByTask.get(task.id);
                                    if (!sub) return null;
                                    return (
                                      <span className="flex items-center gap-0.5 text-emerald-600 font-medium text-xs" title={sub.submissionUrl ?? sub.submissionName ?? ""}>
                                        📎 Submitted
                                      </span>
                                    );
                                  })()}
                                  {status === "IN_PROGRESS" && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent events */}
                  {assignmentEvents.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</p>
                      <div className="space-y-2">
                        {assignmentEvents.slice(0, 8).map((event) => (
                          <div key={event.id} className="flex items-center gap-2.5 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                            <span className={`font-medium ${
                              event.event_type === "OPEN" ? "text-blue-600" :
                              event.event_type === "LINK_CLICK" ? "text-indigo-600" :
                              event.event_type === "LINK_RETURN" ? "text-amber-600" :
                              "text-gray-600"
                            }`}>
                              {event.event_type === "LINK_RETURN" ? "Doc read" : event.event_type.replace(/_/g, " ")}
                            </span>
                            {(event.read_time_sec ?? 0) > 0 && (
                              <span className="text-gray-400">
                                {(event.read_time_sec ?? 0) >= 60
                                  ? `${Math.round((event.read_time_sec ?? 0) / 60)}m`
                                  : `${event.read_time_sec}s`}
                                {event.event_type === "LINK_RETURN" ? " on link" : " read"}
                              </span>
                            )}
                            <span className="ml-auto text-gray-400">
                              {new Date(event.timestamp).toLocaleString("en-US", {
                                month: "short", day: "numeric",
                                hour: "numeric", minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
