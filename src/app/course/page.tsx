"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { CourseCard } from "@/components/CourseCard";
import { IssueComposer } from "@/components/IssueComposer";
import { RecentActivityPanel } from "@/components/RecentActivityPanel";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

type CourseView = "briefing" | "propose" | "records";

export default function CoursePage() {
  return (
    <Suspense fallback={<div className="app-shell"><div className="app-frame"><p className="py-6 text-center text-sm text-gray-400">Loading...</p></div></div>}>
      <CoursePageInner />
    </Suspense>
  );
}

function CoursePageInner() {
  const { operator } = useOperatorSession();
  const searchParams = useSearchParams();
  const operatorProfile = useQuery(
    api.users.getById,
    operator?.operatorId ? { operatorId: operator.operatorId } : "skip"
  );
  const allowedPrograms = operatorProfile?.programIds ?? [];
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [activeView, setActiveView] = useState<CourseView>("briefing");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowedPrograms.length) {
      setSelectedProgram("");
      return;
    }
    const programParam = searchParams.get("program");
    if (programParam && allowedPrograms.includes(programParam)) {
      setSelectedProgram(programParam);
      return;
    }
    if (!selectedProgram || !allowedPrograms.includes(selectedProgram)) {
      setSelectedProgram(allowedPrograms[0]);
    }
  }, [allowedPrograms, selectedProgram, searchParams]);

  const canAccess =
    (operatorProfile?.role === "professor" || operatorProfile?.role === "academic_advisor") &&
    allowedPrograms.length > 0 && !!selectedProgram;

  const courses = useQuery(
    api.courses.getByProgram,
    canAccess && operator
      ? { operatorId: operator.operatorId, programId: selectedProgram }
      : "skip"
  );
  const program = useQuery(
    api.programs.getById,
    canAccess && operator
      ? { operatorId: operator.operatorId, programId: selectedProgram }
      : "skip"
  );
  const metrics = useQuery(
    api.operations.getCourseMetrics,
    canAccess && operator
      ? { operatorId: operator.operatorId, programId: selectedProgram }
      : "skip"
  );
  const actionItems = useQuery(
    api.actionItems.list,
    canAccess && operator
      ? { operatorId: operator.operatorId, programId: selectedProgram }
      : "skip"
  );
  const updateCourseStatus = useMutation(api.courses.updateStatus);

  const activeCourses = useMemo(
    () => courses?.filter((c: any) => c.status === "active") || [],
    [courses]
  );
  const filteredCourses = useMemo(() => {
    const base = courses ?? [];
    return base.filter((c: any) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      return true;
    });
  }, [courses, statusFilter, typeFilter]);

  const underReviewCount = (courses ?? []).filter((c: any) => c.status === "under_review").length;

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

  const nextAction = (actionItems ?? []).find((item: any) => item.status !== "completed");

  if (!operator) {
    return <WorkspaceAccessState title="Course workspace" message="Select a professor or advisor session from home before entering this workspace." />;
  }
  if (operatorProfile === undefined) {
    return <WorkspaceAccessState title="Course workspace" message="Loading user session..." />;
  }
  if (operatorProfile?.role !== "professor" && operatorProfile?.role !== "academic_advisor") {
    return <WorkspaceAccessState title="Course workspace" message="This workspace is only available to professor or advisor sessions." />;
  }
  if (!selectedProgram) {
    return <WorkspaceAccessState title="Course workspace" message="No program is assigned to this user session." />;
  }

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col gap-0">
        <header className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr;</Link>
            <h1 className="text-sm font-semibold text-gray-900">{program?.name ?? selectedProgram}</h1>
            <select
              name="programSelector"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
            >
              {allowedPrograms.map((pid: string) => (
                <option key={pid} value={pid}>{pid}</option>
              ))}
            </select>
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
            <span className="hidden text-xs text-gray-400 sm:inline">{operatorProfile.name}</span>
          </div>
        </header>

        <nav className="flex gap-4 border-b border-gray-200 pt-2">
          <TabButton active={activeView === "briefing"} label="Briefing" onClick={() => setActiveView("briefing")} />
          <TabButton active={activeView === "propose"} label="Propose" onClick={() => setActiveView("propose")} />
          <TabButton active={activeView === "records"} label="Records" onClick={() => setActiveView("records")} />
        </nav>

        <div className="mt-4 flex flex-col gap-5 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            {activeView === "briefing" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricBadge label="Active" value={metrics?.activeCourseCount ?? activeCourses.length} />
                  <MetricBadge label="Under review" value={metrics?.underReviewCount ?? underReviewCount} />
                  <MetricBadge label="Completion" value={metrics?.avgCompletionRate ? `${(metrics.avgCompletionRate * 100).toFixed(0)}%` : "--"} />
                  <MetricBadge label="Utilization" value={metrics?.avgUtilization ? `${(metrics.avgUtilization * 100).toFixed(0)}%` : "--"} />
                </div>

                <div>
                  <div className="flex items-center gap-2 pb-2">
                    <select name="courseStatusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="under_review">Under review</option>
                      <option value="proposed">Proposed</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                    <select name="courseTypeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All types</option>
                      <option value="core">Core</option>
                      <option value="elective">Elective</option>
                      <option value="capstone">Capstone</option>
                      <option value="lab">Lab</option>
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

                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" programId={selectedProgram} />
                <RecentActivityPanel operatorId={operator.operatorId} programId={selectedProgram} title="Activity" />
              </>
            )}

            {activeView === "propose" && (
              <>
                <IssueComposer
                  operatorId={operator.operatorId}
                  programId={selectedProgram}
                  campusId={program?.campus || "Main Campus"}
                  reporterName={operatorProfile.name}
                  reporterRole={operatorProfile.role}
                />
                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" programId={selectedProgram} />
              </>
            )}

            {activeView === "records" && (
              <>
                <div>
                  <div className="flex items-center gap-2 pb-2">
                    <select name="courseStatusFilter2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="under_review">Under review</option>
                      <option value="proposed">Proposed</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                    <select name="courseTypeFilter2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="all">All types</option>
                      <option value="core">Core</option>
                      <option value="elective">Elective</option>
                      <option value="capstone">Capstone</option>
                      <option value="lab">Lab</option>
                    </select>
                    <span className="ml-auto text-xs text-gray-400">{filteredCourses.length} shown</span>
                  </div>
                  {!courses ? (
                    <p className="py-6 text-center text-sm text-gray-400">Loading courses...</p>
                  ) : filteredCourses.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No courses match current filters.</p>
                  ) : (
                    <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
                      {filteredCourses.map((course: any) => (
                        <CourseCard
                          key={course._id}
                          course={course}
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
                <ActionItemsPanel operatorId={operator.operatorId} title="Action items" programId={selectedProgram} />
                <RecentActivityPanel operatorId={operator.operatorId} programId={selectedProgram} title="Activity" />
              </>
            )}
          </div>

          <div className="hidden w-[400px] shrink-0 xl:block">
            <ChatPanel
              operatorId={operator.operatorId}
              programId={selectedProgram}
              issueContext={courseContext}
              onClearIssue={selectedCourseId ? () => setSelectedCourseId(null) : undefined}
              operatorName={operatorProfile?.name}
            />
          </div>
        </div>

        <div className="mt-4 xl:hidden">
          <ChatPanel operatorId={operator.operatorId} programId={selectedProgram} />
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
