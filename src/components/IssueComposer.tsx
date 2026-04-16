"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "convex/react";

import { api } from "../../convex/_generated/api";
import { uploadFilesToConvex } from "@/lib/fileUploads";

interface CourseComposerProps {
  operatorId: string;
  programId: string;
  campusId: string;
  reporterName: string;
  reporterRole: string;
}

const courseTypes = [
  "core",
  "elective",
  "capstone",
  "lab",
];

const semesters = ["Fall 2026", "Spring 2027", "Fall 2027"];

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function IssueComposer({
  operatorId,
  programId,
  campusId,
  reporterName,
  reporterRole,
}: CourseComposerProps) {
  const createCourse = useMutation(api.courses.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createFileRecord = useMutation(api.files.create);
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseType, setCourseType] = useState("elective");
  const [credits, setCredits] = useState("3");
  const [semester, setSemester] = useState("Fall 2026");
  const [enrollmentCap, setEnrollmentCap] = useState("40");
  const [prerequisites, setPrerequisites] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => courseCode.trim() && title.trim() && description.trim() && !submitting,
    [courseCode, title, description, submitting]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const createdCourse = await createCourse({
        operatorId,
        programId,
        courseCode: courseCode.trim(),
        title: title.trim(),
        credits: Number(credits) || 3,
        description: description.trim(),
        type: courseType,
        prerequisites: prerequisites.trim() ? prerequisites.split(",").map(p => p.trim()) : [],
        semester,
        enrollmentCap: Number(enrollmentCap) || 40,
        learningOutcomes: learningOutcomes.trim() ? learningOutcomes.split("\n").map(o => o.trim()).filter(Boolean) : [],
        instructorName: reporterName,
      });

      if (files.length > 0) {
        await uploadFilesToConvex({
          files,
          generateUploadUrl,
          createFileRecord,
          context: {
            operatorId,
            courseId: createdCourse.courseId,
            programId,
            campusId,
            uploadedBy: reporterName,
          },
        });
      }

      setCourseCode("");
      setTitle("");
      setDescription("");
      setCourseType("elective");
      setCredits("3");
      setSemester("Fall 2026");
      setEnrollmentCap("40");
      setPrerequisites("");
      setLearningOutcomes("");
      setFiles([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Course Proposal</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Propose a new course</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Define the course code, learning outcomes, prerequisites, and supporting
            documents for curriculum review.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-500">
          {programId}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="Course code (e.g., CS430)"
                className="field-input"
              />
              <input
                name="courseTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Course title"
                className="field-input"
              />
            </div>
            <textarea
              name="courseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the course content, objectives, and how it fits in the curriculum."
              className="field-input min-h-24 resize-none"
            />
            <textarea
              name="learningOutcomes"
              value={learningOutcomes}
              onChange={(e) => setLearningOutcomes(e.target.value)}
              placeholder="Learning outcomes (one per line)"
              className="field-input min-h-20 resize-none"
            />
          </div>

          <div className="panel-strong p-4">
            <p className="section-label">Classification</p>
            <div className="mt-3 space-y-3">
              <select
                name="courseType"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="field-input"
              >
                {courseTypes.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                name="credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="Credits"
                className="field-input"
              />
              <select
                name="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="field-input"
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                name="enrollmentCap"
                value={enrollmentCap}
                onChange={(e) => setEnrollmentCap(e.target.value)}
                placeholder="Enrollment cap"
                className="field-input"
              />
              <input
                name="prerequisites"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="Prerequisites (comma-separated codes)"
                className="field-input"
              />
            </div>
          </div>
        </div>

        <div className="panel-strong border-dashed p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-label">Supporting Documents</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add syllabi, curriculum maps, or supporting documents for the proposal review.
              </p>
            </div>
            <label className="btn-secondary w-fit cursor-pointer px-4 py-2.5">
              Add files
              <input
                name="courseAttachments"
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  if (selected.length > 0) {
                    setFiles((current) => [...current, ...selected]);
                  }
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {files.length ? (
            <div className="mt-4 grid gap-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-[rgba(72,57,39,0.12)] bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {(file.type || "application/octet-stream").replace("/", " / ")} /{" "}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
                    }
                    className="btn-secondary px-3 py-1.5 text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-[rgba(72,57,39,0.08)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            New proposals are immediately available to chat, department review, and action-item
            generation.
          </p>
          <button type="submit" disabled={!canSubmit} className="btn-primary w-full sm:w-auto">
            {submitting ? "Creating proposal..." : "Create proposal"}
          </button>
        </div>
      </form>
    </section>
  );
}
