import { AttachmentList } from "./AttachmentList";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  proposed: "bg-sky-100 text-sky-800 border-sky-200",
  deprecated: "bg-slate-100 text-slate-500 border-slate-200",
};

const typeStyles: Record<string, string> = {
  core: "bg-indigo-100 text-indigo-700 border-indigo-200",
  elective: "bg-teal-100 text-teal-700 border-teal-200",
  capstone: "bg-purple-100 text-purple-700 border-purple-200",
  lab: "bg-orange-100 text-orange-700 border-orange-200",
};

interface CourseCardProps {
  course: {
    courseId: string;
    programId: string;
    courseCode: string;
    title: string;
    credits: number;
    description: string;
    type: string;
    status: string;
    prerequisites: string[];
    semester: string;
    enrollmentCap: number;
    learningOutcomes: string[];
    instructorName?: string;
  };
  attachments?: Array<{
    fileId: string;
    filename: string;
    mimeType: string;
    fileCategory: string;
    sizeBytes: number;
    url?: string | null;
  }>;
  showProgram?: boolean;
  onSelect?: (courseId: string) => void;
  isSelected?: boolean;
  onUpdateStatus?: (courseId: string, status: string) => void;
}

export function CourseCard({
  course,
  attachments = [],
  showProgram,
  onSelect,
  isSelected,
  onUpdateStatus,
}: CourseCardProps) {
  return (
    <article
      onClick={onSelect ? () => onSelect(course.courseId) : undefined}
      className={`panel-strong p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
        course.status === "deprecated" ? "opacity-75" : ""
      } ${course.status === "under_review" ? "ring-1 ring-amber-200" : ""} ${
        onSelect ? "cursor-pointer" : ""
      } ${isSelected ? "border-l-4 border-l-indigo-500 ring-1 ring-indigo-200" : ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-600">
              {course.courseCode}
            </span>
            <span className={`rounded-full border px-2.5 py-1 font-medium ${
              typeStyles[course.type] || ""
            }`}>
              {course.type}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
              {course.credits} credits
            </span>
            {showProgram ? (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                {course.programId}
              </span>
            ) : null}
          </div>
          <div>
            <h3 className={`text-base font-semibold text-slate-900 ${onSelect ? "hover:text-indigo-600 transition-colors" : ""}`}>{course.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:max-w-[260px] sm:justify-end">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              statusStyles[course.status] || ""
            }`}
          >
            {course.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {course.prerequisites.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium">Prerequisites:</span>
          {course.prerequisites.map((prereq) => (
            <span key={prereq} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
              {prereq}
            </span>
          ))}
        </div>
      )}

      <AttachmentList attachments={attachments} compact />

      <div className="mt-4 flex flex-col gap-3 border-t border-[rgba(72,57,39,0.08)] pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {course.instructorName && <span>{course.instructorName}</span>}
          {course.instructorName && <span>/</span>}
          <span>{course.semester}</span>
          <span>/</span>
          <span>Cap: {course.enrollmentCap}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {course.status === "proposed" && onUpdateStatus ? (
            <button
              type="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onUpdateStatus(course.courseId, "active"); }}
              className="btn-secondary px-3 py-1.5 text-[11px]"
            >
              Approve
            </button>
          ) : null}
          {course.status === "active" && onUpdateStatus ? (
            <button
              type="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onUpdateStatus(course.courseId, "under_review"); }}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 transition hover:bg-amber-100"
            >
              Flag for review
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
