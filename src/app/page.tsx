"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOperatorSession } from "@/components/OperatorSessionProvider";

const roleCards = [
  {
    href: "/course",
    role: "professor",
    eyebrow: "Course Mode",
    title: "Single-course view for faculty",
    description:
      "Review learning objectives, enrollment trends, student feedback, prerequisite mapping, and track action items for your assigned courses.",
    details: ["Enrollment data", "Student evaluations", "Prerequisite chain", "Action tracking"],
  },
  {
    href: "/department",
    role: "department_chair",
    eyebrow: "Department Mode",
    title: "Multi-program curriculum oversight",
    description:
      "Monitor curriculum gaps, faculty load balance, accreditation compliance, and program health across all programs and campuses.",
    details: ["Curriculum gaps", "Faculty load", "Accreditation compliance", "Program health"],
  },
];

const proofPoints = [
  { label: "Programs in demo", value: "6" },
  { label: "Courses seeded", value: "25" },
  { label: "Golden judge scenarios", value: "20" },
];

export default function Home() {
  const users = useQuery(api.users.listAvailable, {});
  const { operator, setOperator } = useOperatorSession();

  const grouped = {
    professor: (users ?? []).filter((user: any) => user.role === "professor"),
    department_chair: (users ?? []).filter((user: any) => user.role === "department_chair"),
    academic_advisor: (users ?? []).filter((user: any) => user.role === "academic_advisor"),
  };

  return (
    <main className="app-shell">
      <div className="app-frame">
        <section className="glass-panel overflow-hidden">
          <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.8fr] lg:px-12 lg:py-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="section-label">Education Course Planning Support</p>
                <div className="max-w-3xl space-y-4">
                  <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl lg:text-6xl">
                    Curriculum AI that reads the data, the policy, and the evidence.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    This workspace is designed for professors and department chairs who need
                    fast curriculum decisions with receipts: enrollment trends, accreditation
                    policies, student evaluations, and tracked follow-through.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {proofPoints.map((point) => (
                  <div key={point.label} className="metric-tile">
                    <p className="section-label">{point.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{point.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] border border-[rgba(72,57,39,0.12)] bg-white/80 p-5">
                <p className="section-label">User Session</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pick a user identity before entering a workspace. The app enforces
                  program and campus access against this session.
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Professors
                    </p>
                    <div className="mt-2 space-y-2">
                      {grouped.professor.map((user: any) => (
                        <button
                          key={user.operatorId}
                          type="button"
                          onClick={() =>
                            setOperator({
                              operatorId: user.operatorId,
                              role: user.role,
                              name: user.name,
                            })
                          }
                          className={`w-full rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                            operator?.operatorId === user.operatorId
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-[rgba(72,57,39,0.12)] bg-white"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.programIds.join(", ")}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Department Chair
                    </p>
                    <div className="mt-2 space-y-2">
                      {grouped.department_chair.map((user: any) => (
                        <button
                          key={user.operatorId}
                          type="button"
                          onClick={() =>
                            setOperator({
                              operatorId: user.operatorId,
                              role: user.role,
                              name: user.name,
                            })
                          }
                          className={`w-full rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                            operator?.operatorId === user.operatorId
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-[rgba(72,57,39,0.12)] bg-white"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.campusIds.join(", ")}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Academic Advisor
                    </p>
                    <div className="mt-2 space-y-2">
                      {grouped.academic_advisor.map((user: any) => (
                        <button
                          key={user.operatorId}
                          type="button"
                          onClick={() =>
                            setOperator({
                              operatorId: user.operatorId,
                              role: user.role,
                              name: user.name,
                            })
                          }
                          className={`w-full rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                            operator?.operatorId === user.operatorId
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-[rgba(72,57,39,0.12)] bg-white"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">All programs</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {operator ? (
                  <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Active session: <span className="font-semibold text-slate-900">{operator.name}</span>
                    {" / "}
                    {operator.role.replace("_", " ")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="panel-strong relative overflow-hidden p-5 sm:p-6">
              <div className="relative space-y-5">
                <div>
                  <p className="section-label">Why This UI Exists</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Curriculum decisions need grounded evidence, not guesswork.
                  </h2>
                </div>
                <div className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    Faculty need a single place to see enrollment trends, accreditation
                    requirements, student feedback, prerequisite chains, and what action
                    is next.
                  </p>
                  <p>
                    The product below is organized around that assumption: data first,
                    gaps surfaced early, and every recommendation tied back to something
                    inspectable.
                  </p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-white/90 p-4">
                  <p className="section-label">Shipped in this build</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>Role-aware user session and backend access checks</li>
                    <li>Course proposal with document attachments</li>
                    <li>Gemini-backed grounded assistant with curriculum tools</li>
                    <li>Audit logging for agent, course, and action events</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {roleCards.map((card) => {
            const enabled =
              operator?.role === card.role ||
              (card.role === "professor" && operator?.role === "academic_advisor") ||
              (card.role === "department_chair" && operator?.role === "department_chair");
            return (
              <div
                key={card.href}
                className={`glass-panel px-6 py-6 sm:px-7 ${enabled ? "" : "opacity-85"}`}
              >
                <p className="section-label">{card.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">{card.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{card.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {card.details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
                <div className="mt-6">
                  {enabled ? (
                    <Link href={card.href} className="btn-primary inline-flex">
                      Enter workspace
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-500">
                      Select a matching user session to enter this workspace.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
