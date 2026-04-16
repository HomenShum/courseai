"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { CourseCard } from "@/components/CourseCard";
import { RecentActivityPanel } from "@/components/RecentActivityPanel";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

const CAMPUS_ID = "Main Campus";
type DepartmentView = "overview" | "gaps" | "queue";

export default function DepartmentPage() {
  return (
    <Suspense fallback={<div className="app-shell"><div className="app-frame"><p className="py-6 text-center text-sm text-gray-400">Loading...</p></div></div>}>
      <DepartmentPageInner />
    </Suspense>
  );
}

function DepartmentPageInner() {
  const { operator } = useOperatorSession();
  const searchParams = useSearchParams();
  const operatorProfile = useQuery(
    api.users.getById,
    operator?.operatorId ? { operatorId: operator.operatorId } : "skip"
  );
  const hasCampusAccess = operatorProfile?.role === "department_chair";

  const [activeView, setActiveView] = useState<DepartmentView>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    const programParam = searchParams.get("program");
    if (programParam) setProgramFilter(programParam);
  }, [searchParams]);

  const programs = useQuery(
    api.programs.getAll,
    hasCampusAccess && operator ? { operatorId: operator.operatorId } : "skip"
  );
  const courses = useQuery(
    api.courses.getAll,
    hasCampusAccess && operator ? { operatorId: operator.operatorId } : "skip"
  );
  const summary = useQuery(
    api.operations.getDepartmentSummary,
    hasCampusAccess && operator ? { operatorId: operator.operatorId, campusId: CAMPUS_ID } : "skip"
  );
  const departmentActionItems = useQuery(
    api.actionItems.list,
    hasCampusAccess && operator ? { operatorId: operator.operatorId, campusId: CAMPUS_ID } : "skip"
  );
  const updateCourseStatus = useMutation(api.courses.updateStatus);

  const activeCourses = courses?.filter((c: any) => c.status === "active") || [];
  const filteredCourses = useMemo(() => {
    const base = courses ?? [];
    return base.filter((c: any) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (programFilter !== "all" && c.programId !== programFilter) return false;
      return true;
    });
  }, [courses, statusFilter, typeFilter, programFilter]);

  const underReviewCount = (courses ?? []).filter((c: any) => c.status === "under_review").length;
  const proposedCount = (courses ?? []).filter((c: any) => c.status === "proposed").length;

  const programHealthCards = (programs ?? [])
    .map((p: any) => {
      const pCourses = (courses ?? []).filter((c: any) => c.programId === p.programId);
      const activeCount = pCourses.filter((c: any) => c.status === "active").length;
      const reviewCount = pCourses.filter((c: any) => c.status === "under_review").length;
      return { ...p, courseCount: pCourses.length, activeCount, reviewCount };
    })
    .sort((a: any, b: any) => b.reviewCount - a.reviewCount || b.courseCount - a.courseCount)
    .slice(0, 6);

  const selectedCourse = selectedCourseId
    ? (courses ?? []).find((c: any) => c.courseId === selectedCourseId)
    : null;
  const courseContext = useMemo(
    () =>
      selectedCourse
        ? { issueId: selectedCourse.courseId, title: selectedCourse.title, description: selectedCourse.description }
        : undefined,
    [selectedCourse?.courseId, selectedCourse?.title, selectedCourse?.description]
  );

  if (!operator) {
    return <WorkspaceAccessState title="Department command" message="Select a department chair session from home before entering this workspace." />;
  }
  if (operatorProfile === undefined) {
    return <WorkspaceAccessState title="Department command" message="Loading user session..." />;
  }
  if (!hasCampusAccess) {
    return <WorkspaceAccessState title="Department command" message="This workspace is only available to department chair sessions." />;
  }

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col gap-0">
        <header className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr;</Link>
            <h1 className="text-sm font-semibold text-gray-900">Department Overview</h1>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">{CAMPUS_ID}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {activeCourses.length} active
            </span>
            {underReviewCount > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {underReviewCount} under review
              </span>
            )}
            {proposedCount > 0 && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                {proposedCount} proposed
              </span>
            )}
            <span className="hidden text-xs text-gray-400 sm:inline">{operatorProfile.name}</span>
          </div>
        </header>

        <nav className="flex gap-4 border-b border-gray-200 pt-2">
          <TabButton active={activeView === "overview"} label="Overview" onClick={() => setActiveView("overview")} />
          <TabButton active={activeView === "gaps"} label="Gaps" onClick={() => setActiveView("gaps")} />
          <TabButton active={activeView === "queue"} label={`Queue (${underReviewCount + proposedCount})`} onClick={() => setActiveView("queue")} />
        </nav>

        <div className="mt-4 flex flex-col gap-5 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            {activeView === "overview" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricBadge label="Programs" value={summary?.programCount ?? (programs ?? []).length} />
                  <MetricBadge label="Active courses" value={summary?.activeCourseCount ?? activeCourses.length} />
                  <MetricBadge label="Under review" value={summary?.underReviewCount ?? underReviewCount} />
                  <MetricBadge label="Faculty overloaded" value={summary?.overloadedFacultyCount ?? 0} />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button type="button" onClick={() => setProgramFilter("all")}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${programFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    All programs
                  </button>
                  {(programs ?? []).map((p: any) => (
                    <button key={p.programId} type="button" onClick={() => setProgramFilter(p.programId)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${programFilter === p.programId ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {p.programId}
                    </button>
                  ))}
                </div>

                {programHealthCards.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {programHealthCards.map((p: any) => (
                      <button key={p.programId} type="button" onClick={() => setProgramFilter(p.programId)}
                        className="rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-gray-300">
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.degreeType} / {p.campus}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{p.activeCount} active</span>
                          {p.reviewCount > 0 && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">{p.reviewCount} review</span>
                          )}
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">{p.accreditationStatus}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 pb-2">
                    <select name="deptStatusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="under_review">Under review</option>
                      <option value="proposed">Proposed</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                    <select name="deptTypeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All types</option>
                      <option value="core">Core</option>
                      <option value="elective">Elective</option>
                      <option value="capstone">Capstone</option>
                    </select>
                    <span className="ml-auto text-xs text-gray-400">{filteredCourses.length} shown</span>
                  </div>

                  {!courses ? (
                    <p className="py-6 text-center text-sm text-gray-400">Loading courses...</p>
                  ) : filteredCourses.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No courses match current filters.</p>
                  ) : (
                    <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                      {filteredCourses.map((course: any) => (
                        <CourseCard
                          key={course._id}
                          course={course}
                          showProgram
                          onSelect={setSelectedCourseId}
                          isSelected={selectedCourseId === course.courseId}
                          onUpdateStatus={(courseId, status) =>
                            updateCourseStatus({ operatorId: operator.operatorId, courseId, status })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" campusId={CAMPUS_ID} />
                <RecentActivityPanel operatorId={operator.operatorId} campusId={CAMPUS_ID} title="Activity" />
              </>
            )}

            {activeView === "gaps" && (
              <>
                <div className="space-y-3">
                  {(() => {
                    const gapCourses = (courses ?? []).filter((c: any) => c.status === "under_review" || c.status === "proposed");
                    return gapCourses.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">No curriculum gaps or proposals requiring attention.</p>
                    ) : (
                      gapCourses.map((course: any) => (
                        <CourseCard
                          key={course._id}
                          course={course}
                          showProgram
                          onSelect={setSelectedCourseId}
                          isSelected={selectedCourseId === course.courseId}
                          onUpdateStatus={(courseId, status) =>
                            updateCourseStatus({ operatorId: operator.operatorId, courseId, status })
                          }
                        />
                      ))
                    );
                  })()}
                </div>
                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" campusId={CAMPUS_ID} />
              </>
            )}

            {activeView === "queue" && (() => {
              const queueCourses = (courses ?? [])
                .filter((c: any) => c.status === "under_review" || c.status === "proposed")
                .sort((a: any, b: any) => {
                  const order = { under_review: 0, proposed: 1, active: 2, deprecated: 3 };
                  return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4);
                });
              return (
                <>
                  <div>
                    <p className="pb-2 text-xs text-gray-400">{queueCourses.length} course{queueCourses.length !== 1 ? "s" : ""} awaiting review</p>
                    {queueCourses.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">No courses in the review queue.</p>
                    ) : (
                      <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
                        {queueCourses.map((course: any) => (
                          <div key={course._id} className="space-y-2">
                            <CourseCard
                              course={course}
                              showProgram
                              onSelect={setSelectedCourseId}
                              isSelected={selectedCourseId === course.courseId}
                            />
                            <div className="flex items-center gap-2 pl-2">
                              <button type="button"
                                onClick={() => updateCourseStatus({ operatorId: operator.operatorId, courseId: course.courseId, status: "active" })}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-indigo-700">
                                Approve
                              </button>
                              <button type="button"
                                onClick={() => updateCourseStatus({ operatorId: operator.operatorId, courseId: course.courseId, status: "deprecated" })}
                                className="btn-secondary px-3 py-1.5 text-[11px]">
                                Deprecate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ActionItemsPanel operatorId={operator.operatorId} title="Action items" campusId={CAMPUS_ID} />
                  <RecentActivityPanel operatorId={operator.operatorId} campusId={CAMPUS_ID} title="Activity" />
                </>
              );
            })()}
          </div>

          <div className="hidden w-[420px] shrink-0 xl:block">
            <ChatPanel
              operatorId={operator.operatorId}
              campusId={CAMPUS_ID}
              issueContext={courseContext}
              onClearIssue={selectedCourseId ? () => setSelectedCourseId(null) : undefined}
              operatorName={operatorProfile?.name}
            />
          </div>
        </div>

        <div className="mt-4 xl:hidden">
          <ChatPanel operatorId={operator.operatorId} campusId={CAMPUS_ID} />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`border-b-2 px-3 pb-2 text-sm font-medium transition ${active ? "border-indigo-600 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
      {label}
    </button>
  );
}

function MetricBadge({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase text-gray-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function WorkspaceAccessState({ title, message }: { title: string; message: string }) {
  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link>
            <p className="mt-3 text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
