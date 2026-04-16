import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";

const MODEL_NAME = "gemini-3.1-pro-preview";
const PLANNER_MODEL_NAME = "gemini-3.1-flash-lite-preview";
const INLINE_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type ChatActionResult = {
  answer: string;
  trace: any;
  messageId: any;
  answerPacketId: string | null;
  quality: any;
};

const FUNCTION_DECLARATIONS = [
  {
    name: "search_courses",
    description:
      "Search for courses. Can filter by program, type, status, or keyword. Use program_id='ALL' to search all programs.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        program_id: {
          type: "string",
          description: "Program ID (e.g., PRG-CS-BS). Use 'ALL' for all programs.",
        },
        type: {
          type: "string",
          description:
            "Filter: core, elective, capstone, lab",
        },
        status: {
          type: "string",
          description: "Filter: active, under_review, proposed, deprecated",
        },
        keyword: {
          type: "string",
          description: "Optional keyword such as machine learning, prerequisite, CS201, or CRS-003.",
        },
      },
      required: ["program_id"],
    },
  },
  {
    name: "search_curricular_policies",
    description:
      "Search curricular policies by policy ID or keyword. Returns policy references for accreditation, prerequisites, enrollment, and credit hour standards.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        policy_id: {
          type: "string",
          description: "Policy ID (e.g., POL-ABET-001)",
        },
        keyword: {
          type: "string",
          description: "Search keyword, such as accreditation, prerequisite, enrollment, or credit",
        },
      },
    },
  },
  {
    name: "get_enrollment_data",
    description:
      "Look up enrollment data for a course. Returns enrollment counts, capacity, waitlist, completion rates, average grades, and drop rates across semesters.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "Course ID (e.g., CRS-001)",
        },
        semester: {
          type: "string",
          description: "Optional specific semester (e.g., Fall 2026)",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "get_faculty_summary",
    description:
      "Get faculty information for a program including expertise, course loads, and overload status.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        program_id: {
          type: "string",
          description: "Program ID (e.g., PRG-CS-BS)",
        },
      },
      required: ["program_id"],
    },
  },
  {
    name: "get_course_summary",
    description:
      "Get course metrics for a program including active/under-review/proposed counts, completion rates, utilization, and faculty load status.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        program_id: {
          type: "string",
          description: "Program ID (e.g., PRG-CS-BS)",
        },
      },
      required: ["program_id"],
    },
  },
  {
    name: "get_program_overview",
    description:
      "Get aggregate overview for a campus or department including program count, course distribution, faculty load, and curriculum gap count.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        campus_id: {
          type: "string",
          description: "Campus (e.g., Main Campus)",
        },
      },
      required: ["campus_id"],
    },
  },
  {
    name: "search_reviews",
    description:
      "Search course reviews including student evaluations, peer reviews, accreditation audits, and curriculum gap analyses.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "Optional course ID to filter reviews",
        },
        type: {
          type: "string",
          description:
            "Optional review type: student_eval, peer_review, accreditation_audit, curriculum_gap",
        },
        query: {
          type: "string",
          description: "Free-text description of what to search for in reviews",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_action_item",
    description:
      "Create a tracked follow-up action item for a course, program, or campus when the recommendation requires an owner and due date.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        course_id: { type: "string" },
        program_id: { type: "string" },
        campus_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        assignee: { type: "string" },
        priority: {
          type: "string",
          description: "critical, high, medium, or low",
        },
        due_at: {
          type: "string",
          description: "ISO timestamp if the work is time-sensitive",
        },
      },
      required: ["title", "description", "assignee", "priority"],
    },
  },
  {
    name: "list_action_items",
    description:
      "List existing action items, optionally filtered by program or campus.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        program_id: { type: "string" },
        campus_id: { type: "string" },
      },
    },
  },
  {
    name: "search_web",
    description:
      "Search the web for current external information when the question requires recent facts about industry trends, accreditation updates, emerging technologies, or educational best practices.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for external information",
        },
      },
      required: ["query"],
    },
  },
];

const TOOLS = [{ googleSearch: {} }, { functionDeclarations: FUNCTION_DECLARATIONS }];

function bytesToBase64(bytes: Uint8Array) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;

    output += alphabet[(triple >> 18) & 0x3f];
    output += alphabet[(triple >> 12) & 0x3f];
    output += index + 1 < bytes.length ? alphabet[(triple >> 6) & 0x3f] : "=";
    output += index + 2 < bytes.length ? alphabet[triple & 0x3f] : "=";
  }

  return output;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "serialization_failed" });
  }
}

function extractUsageTelemetry(response: any) {
  const usage = response?.usageMetadata ?? {};
  return {
    tokensIn: usage.promptTokenCount ?? usage.inputTokenCount,
    tokensOut: usage.candidatesTokenCount ?? usage.outputTokenCount,
    totalTokens: usage.totalTokenCount,
  };
}

function extractGroundingUrls(response: any): string[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const urls = chunks
    .map((chunk: any) => chunk?.web?.uri)
    .filter((value: string | undefined) => Boolean(value));
  return Array.from(new Set(urls));
}

function extractGroundingSources(response: any) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const deduped = new Map<string, any>();

  for (const chunk of chunks) {
    const url = chunk?.web?.uri;
    if (!url || deduped.has(url)) {
      continue;
    }
    let domain = url;
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = url;
    }
    deduped.set(url, {
      rawUrl: url,
      url,
      domain,
      title: chunk?.web?.title,
      snippet: chunk?.retrievedContext,
    });
  }

  return Array.from(deduped.values());
}

function extractTextParts(
  response: any,
  options?: {
    trim?: boolean;
    separator?: string;
  }
): string {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join(options?.separator ?? "\n");
  return options?.trim === false ? text : text.trim();
}

function extractAssistantText(response: any): string {
  return extractTextParts(response, {
    trim: true,
    separator: "\n",
  });
}

function extractFunctionCalls(response: any) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part: any) => part?.functionCall)
    .filter((call: any) => Boolean(call));
}

function appendReference(values: Set<string>, value: unknown) {
  if (typeof value === "string" && value.trim()) {
    values.add(value.trim());
  }
}

function humanizeSummaryKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSummaryValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (/rate|utilization|completion/i.test(key)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value.length > 80 ? `${value.slice(0, 77)}...` : value;
  }

  return null;
}

function summarizeResult(result: unknown): string {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return "0 records returned";
    }
    const sample = result
      .slice(0, 3)
      .map((item: any) => item?.courseId || item?.policyId || item?.reviewId || item?.actionItemId || item?.facultyId || item?.title)
      .filter(Boolean)
      .join(", ");
    return `${result.length} records returned${sample ? ` (${sample})` : ""}`;
  }

  if (!result) {
    return "No result";
  }

  if (typeof result === "string") {
    return result.slice(0, 220);
  }

  if (typeof result === "object") {
    const preview = ["courseId", "policyId", "reviewId", "actionItemId", "facultyId", "title"]
      .map((field) => (result as any)[field])
      .filter(Boolean)
      .join(", ");
    if (preview) {
      return preview;
    }

    const scalarPreview = Object.entries(result as Record<string, unknown>)
      .map(([key, value]) => {
        const formatted = formatSummaryValue(key, value);
        return formatted ? `${humanizeSummaryKey(key)}: ${formatted}` : null;
      })
      .filter(Boolean)
      .slice(0, 4)
      .join(" / ");

    if (scalarPreview) {
      return scalarPreview;
    }

    const keys = Object.keys(result as Record<string, unknown>);
    if (keys.length) {
      return `Object result with ${keys.length} fields: ${keys
        .slice(0, 5)
        .map(humanizeSummaryKey)
        .join(", ")}`;
    }

    return "Object result returned";
  }

  return String(result).slice(0, 220);
}

function deriveKeywordFromQuery(query: string) {
  const cleaned = query
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 6)
    .join(" ");
  return cleaned || query;
}

function shouldUseWebSearch(query: string) {
  return /\b(today|latest|recent|current|industry|accreditation|trend|market|employer|job|salary|emerging|regulation|standard)\b/i.test(
    query
  );
}

function extractFirstJsonBlock(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return null;
}

function buildHistoryContents(messages: any[]) {
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt).slice(-10);
  return sorted.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text:
          message.fileIds?.length > 0
            ? `${message.content}\n\nAttached documents: ${message.fileIds.join(", ")}`
            : message.content,
      },
    ],
  }));
}

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (sizeBytes >= 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${sizeBytes} B`;
}

function supportsInlineAttachment(file: any) {
  return (
    Boolean(file.storageId) &&
    file.sizeBytes <= INLINE_ATTACHMENT_MAX_BYTES &&
    (file.mimeType.startsWith("image/") || file.mimeType === "application/pdf")
  );
}

async function buildAttachmentContext(ctx: any, files: any[]) {
  const parts: any[] = [];
  const summaries: string[] = [];

  for (const file of files) {
    let summary = `- ${file.filename} (${file.fileCategory}, ${formatAttachmentSize(file.sizeBytes)})`;
    if (supportsInlineAttachment(file)) {
      const blob = await ctx.storage.get(file.storageId);
      if (blob) {
        const bytes = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
        parts.push({
          inlineData: {
            data: bytes,
            mimeType: file.mimeType,
          },
        });
        summary += " [included for model inspection]";
      }
    } else if (
      file.storageId &&
      file.sizeBytes <= INLINE_ATTACHMENT_MAX_BYTES &&
      (file.mimeType.startsWith("text/") || file.mimeType === "application/json")
    ) {
      const blob = await ctx.storage.get(file.storageId);
      const text = blob ? (await blob.text()).slice(0, 12000) : "";
      if (text) {
        parts.push({
          text: `Attachment ${file.filename} contents:\n${text}`,
        });
        summary += " [text extracted]";
      }
    } else if (file.fileCategory === "video") {
      summary += " [video stored; not inlined]";
    }
    summaries.push(summary);
  }

  return { parts, summaries };
}

function formatCourseLine(course: any) {
  const extras = [
    course.programId,
    course.type,
    course.status,
    `${course.credits}cr`,
    course.prerequisites?.length ? `prereqs: ${course.prerequisites.join(", ")}` : null,
  ].filter(Boolean);
  return `- ${course.courseId} (${course.courseCode}): ${course.title}${extras.length ? ` (${extras.join(" / ")})` : ""}\n  ${course.description}`;
}

function formatPolicyLine(policy: any) {
  return `- ${policy.policyId}: ${policy.title}\n  ${String(policy.content ?? "").slice(0, 240)}`;
}

function formatEnrollmentLine(item: any) {
  return `- ${item.courseId} ${item.semester}: enrolled ${item.enrolled}/${item.capacity}, waitlist ${item.waitlist}, completion ${(item.completionRate * 100).toFixed(0)}%, avg grade ${item.avgGrade.toFixed(1)}`;
}

function formatReviewLine(review: any) {
  return `- ${review.reviewId} (${review.type}): ${review.courseId}\n  Findings: ${review.findings.slice(0, 200)}\n  Score: ${review.score}`;
}

function formatBriefForPrompt(brief: any, query?: string) {
  const lowerQuery = String(query ?? "").toLowerCase();
  const includeEnrollment =
    /\benroll\b|\bcapacity\b|\bwaitlist\b|\bcompletion\b|\bgrade\b|\bdrop\b|\butilization\b/.test(lowerQuery);
  const includeFaculty =
    /\bfaculty\b|\bload\b|\boverload\b|\binstructor\b|\bteach\b|\bprofessor\b/.test(lowerQuery);
  const includeReviews =
    /\breview\b|\bfeedback\b|\beval\b|\baccreditation\b|\baudit\b|\bgap\b|\bstudent\b|\bscore\b/.test(
      lowerQuery
    );

  return `Scope summary:
- programId: ${brief.scope?.programId ?? "n/a"}
- campusId: ${brief.scope?.campusId ?? "n/a"}
- activeCourseCount: ${brief.scope?.activeCourseCount ?? 0}
- underReviewCount: ${brief.scope?.underReviewCount ?? 0}

Matched courses:
${brief.matchedCourses?.length ? brief.matchedCourses.slice(0, 3).map(formatCourseLine).join("\n") : "- none"}

Prerequisite-linked courses:
${brief.crossProgramCourses?.length ? brief.crossProgramCourses.slice(0, 3).map(formatCourseLine).join("\n") : "- none"}

Policies:
${brief.policies?.length ? brief.policies.slice(0, 3).map(formatPolicyLine).join("\n") : "- none"}

Enrollment highlights:
${includeEnrollment && brief.enrollmentHighlights?.length ? brief.enrollmentHighlights.slice(0, 3).map(formatEnrollmentLine).join("\n") : "- omitted"}

Faculty summary:
${includeFaculty && brief.faculty?.length ? brief.faculty.map((f: any) => `- ${f.name}: ${f.courseLoad}/${f.maxLoad} load, ${f.rank}, expertise: ${f.expertise.join(", ")}`).join("\n") : "- omitted"}

Overloaded faculty:
${includeFaculty && brief.overloadedFaculty?.length ? brief.overloadedFaculty.map((f: any) => `- ${f.name}: ${f.courseLoad}/${f.maxLoad} (OVERLOADED)`).join("\n") : "- omitted"}

Reviews:
${includeReviews && brief.reviews?.length ? brief.reviews.map(formatReviewLine).join("\n") : "- omitted"}`;
}

function collectBriefReferences(references: Set<string>, brief: any) {
  for (const course of [...(brief.matchedCourses ?? []), ...(brief.crossProgramCourses ?? [])]) {
    appendReference(references, course.courseId);
    appendReference(references, course.courseCode);
    appendReference(references, course.programId);
  }
  for (const policy of brief.policies ?? []) {
    appendReference(references, policy.policyId);
  }
  for (const review of brief.reviews ?? []) {
    appendReference(references, review.reviewId);
  }
}

function answerNeedsCoverageFallback(answer: string, brief: any) {
  const normalized = answer.toLowerCase();
  const primaryCourse = brief.matchedCourses?.[0];
  const primaryPolicy = brief.policies?.[0];

  if (primaryCourse?.courseId && !new RegExp(`\\b${escapeForRegex(String(primaryCourse.courseId))}\\b`, "i").test(normalized)) {
    if (!new RegExp(`\\b${escapeForRegex(String(primaryCourse.courseCode))}\\b`, "i").test(normalized)) {
      return true;
    }
  }
  if (primaryPolicy?.policyId && !new RegExp(`\\b${escapeForRegex(String(primaryPolicy.policyId))}\\b`, "i").test(normalized)) {
    return true;
  }
  return false;
}

function shouldUseDeterministicAnswer(query: string, brief: any, hasExternalSources: boolean) {
  if (hasExternalSources) {
    return false;
  }
  if (!brief?.matchedCourses?.length || !brief?.policies?.length) {
    return false;
  }
  return !/\bsummary\b|\beverything\b|\bcompare\b|\btrend\b|\bdepartment\b|\bfull picture\b/i.test(query);
}

function buildDeterministicAnswer(args: any, brief: any) {
  const primaryCourse = brief.matchedCourses?.[0];
  const primaryPolicy = brief.policies?.[0];

  if (!primaryCourse || !primaryPolicy) {
    return null;
  }

  const lines: string[] = [];
  const relatedEnrollment = (brief.enrollmentHighlights ?? []).find(
    (e: any) => e.courseId === primaryCourse.courseId
  );
  const relatedCrossCourses = (brief.crossProgramCourses ?? []).slice(0, 2);

  if (args.programId) {
    lines.push(
      `**${primaryCourse.courseId} (${primaryCourse.courseCode})** — ${primaryCourse.title}. ${primaryCourse.description}`
    );
  } else {
    lines.push(
      `The most relevant course is **${primaryCourse.courseId} (${primaryCourse.courseCode})**: ${primaryCourse.title}. ${primaryCourse.description}`
    );
  }

  if (relatedEnrollment) {
    lines.push(
      `Enrollment data: **${relatedEnrollment.enrolled}/${relatedEnrollment.capacity}** enrolled (${relatedEnrollment.semester}), waitlist ${relatedEnrollment.waitlist}, completion rate ${(relatedEnrollment.completionRate * 100).toFixed(0)}%.`
    );
  }

  lines.push(`Per **${primaryPolicy.policyId} (${primaryPolicy.title})**:`);
  lines.push(String(primaryPolicy.content ?? "").slice(0, 400));

  if (relatedCrossCourses.length > 0) {
    lines.push(
      `Prerequisite chain: ${relatedCrossCourses
        .map((c: any) => `${c.courseId} (${c.courseCode})`)
        .join(", ")} are linked.`
    );
  }

  return lines.join("\n\n");
}

function makeRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

function extractTrackedReferences(text: string) {
  return Array.from(
    new Set((text.match(/\b(?:CRS|POL|PRG|FAC|REV|ACT)-[A-Z0-9-]+\b/gi) ?? []).map((value) => value.toUpperCase()))
  );
}

function buildAllowedReferences(brief: any, references: Set<string>) {
  const allowed = new Set<string>();

  for (const reference of references) {
    appendReference(allowed, reference);
  }
  collectBriefReferences(allowed, brief);

  for (const review of brief.reviews ?? []) {
    appendReference(allowed, review.reviewId);
    appendReference(allowed, review.courseId);
  }
  for (const program of brief.programs ?? []) {
    appendReference(allowed, program.programId);
  }

  return allowed;
}

function buildQualityReport(
  answer: string,
  query: string,
  brief: any,
  references: Set<string>,
  sourceRefs: Map<string, any>
) {
  const normalized = answer.toLowerCase();
  const primaryCourse = brief.matchedCourses?.[0];
  const primaryPolicy = brief.policies?.[0];
  const expectedPrereqChain =
    (brief.crossProgramCourses?.length ?? 0) > 0 ||
    (!brief.scope?.programId && (brief.matchedCourses?.length ?? 0) > 1);
  const multiCourseQuestion =
    !brief.scope?.programId ||
    /\bsummary\b|\bfull picture\b|\bpattern\b|\btrend\b|\bcompare\b|\bwhich programs\b|\bdepartment\b/i.test(
      query
    );
  const answerRefs = extractTrackedReferences(answer);
  const allowedRefs = buildAllowedReferences(brief, references);
  const unsupportedRefs = answerRefs.filter((reference) => !allowedRefs.has(reference));
  const checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    severity: "error" | "warning";
    message: string;
  }> = [];

  const addCheck = (
    key: string,
    label: string,
    passed: boolean,
    message: string,
    severity: "error" | "warning"
  ) => {
    checks.push({ key, label, passed, message, severity });
  };

  addCheck(
    "primary_course",
    "Course reference",
    !primaryCourse || new RegExp(`\\b${escapeForRegex(String(primaryCourse.courseId))}\\b|\\b${escapeForRegex(String(primaryCourse.courseCode))}\\b`, "i").test(normalized),
    primaryCourse
      ? new RegExp(`\\b${escapeForRegex(String(primaryCourse.courseId))}\\b|\\b${escapeForRegex(String(primaryCourse.courseCode))}\\b`, "i").test(normalized)
        ? `Final answer references ${primaryCourse.courseId} (${primaryCourse.courseCode}).`
        : `Final answer is missing course reference ${primaryCourse.courseId}.`
      : "No primary course was required for this answer.",
    "error"
  );

  addCheck(
    "governing_policy",
    "Policy reference",
    !primaryPolicy || new RegExp(`\\b${escapeForRegex(String(primaryPolicy.policyId))}\\b`, "i").test(normalized),
    primaryPolicy
      ? new RegExp(`\\b${escapeForRegex(String(primaryPolicy.policyId))}\\b`, "i").test(normalized)
        ? `Final answer references ${primaryPolicy.policyId}.`
        : `Final answer is missing policy reference ${primaryPolicy.policyId}.`
      : "No governing policy was required for this answer.",
    "error"
  );

  addCheck(
    "action_steps",
    "Actionable recommendations",
    /(?:^|\n)\s*(?:\d+\.|-)\s+\S/m.test(answer) || /\bnext steps?\b|\brecommend\b|\baction\b/i.test(answer),
    /(?:^|\n)\s*(?:\d+\.|-)\s+\S/m.test(answer) || /\bnext steps?\b|\brecommend\b|\baction\b/i.test(answer)
      ? "The answer includes actionable recommendations."
      : "The answer needs clearer action recommendations.",
    multiCourseQuestion ? "warning" : "error"
  );

  addCheck(
    "enrollment_context",
    "Enrollment context",
    !/\benroll/i.test(query) || /\d+\s*\/\s*\d+|\bcapacity\b|\benroll/i.test(answer),
    /\benroll/i.test(query)
      ? /\d+\s*\/\s*\d+|\bcapacity\b|\benroll/i.test(answer)
        ? "The answer includes enrollment data."
        : "Expected enrollment data is missing."
      : "No enrollment context was required.",
    "warning"
  );

  addCheck(
    "prerequisite_chain",
    "Prerequisite context",
    !expectedPrereqChain ||
      /\bprerequisite\b|\bchain\b|\bdependenc/i.test(answer),
    expectedPrereqChain
      ? /\bprerequisite\b|\bchain\b|\bdependenc/i.test(answer)
        ? "The answer addresses prerequisite relationships."
        : "The answer should make prerequisite relationships more explicit."
      : "No prerequisite context was required.",
    "warning"
  );

  addCheck(
    "priority_order",
    "Priority ordering",
    !multiCourseQuestion ||
      /(?:^|\n)\s*\d+\.\s/m.test(answer) ||
      /\bpriority\b|\bfirst\b|\bsecond\b|\bstart with\b/i.test(answer),
    multiCourseQuestion
      ? /(?:^|\n)\s*\d+\.\s/m.test(answer) || /\bpriority\b|\bfirst\b|\bsecond\b|\bstart with\b/i.test(answer)
        ? "The answer makes prioritization explicit."
        : "Department or multi-course answers should spell out priority order."
      : "Priority ordering is optional for this request.",
    "warning"
  );

  addCheck(
    "unsupported_refs",
    "Reference integrity",
    unsupportedRefs.length === 0,
    unsupportedRefs.length === 0
      ? "All referenced IDs are backed by the current evidence packet."
      : `Unsupported IDs detected in the answer: ${unsupportedRefs.join(", ")}.`,
    "error"
  );

  const externalFactsQuestion = shouldUseWebSearch(query);
  addCheck(
    "external_source_backing",
    "External source backing",
    !externalFactsQuestion || sourceRefs.size > 0,
    externalFactsQuestion
      ? sourceRefs.size > 0
        ? `External question is backed by ${sourceRefs.size} grounded source${sourceRefs.size === 1 ? "" : "s"}.`
        : "External question was answered without grounded external sources."
      : "No external grounding was required.",
    "warning"
  );

  const failedErrors = checks.filter((check) => !check.passed && check.severity === "error").length;
  const failedWarnings = checks.filter((check) => !check.passed && check.severity === "warning").length;
  const status = failedErrors > 0 ? "fail" : failedWarnings > 0 ? "warning" : "pass";
  const summary =
    status === "pass"
      ? "All runtime quality checks passed."
      : status === "warning"
        ? `${failedWarnings} advisory quality check${failedWarnings === 1 ? "" : "s"} need attention.`
        : `${failedErrors} blocking quality check${failedErrors === 1 ? "" : "s"} failed.`;

  return {
    status,
    summary,
    checks,
    unsupportedRefs,
    referencedIds: answerRefs,
  };
}

function normalizeContents(contents: any) {
  if (typeof contents === "string") {
    return [
      {
        role: "user",
        parts: [{ text: contents }],
      },
    ];
  }

  if (Array.isArray(contents)) {
    return contents;
  }

  return [
    {
      role: "user",
      parts: [{ text: String(contents ?? "") }],
    },
  ];
}

function buildGenerateContentPayload(request: any) {
  const config = request?.config ?? {};
  const payload: Record<string, any> = {
    contents: normalizeContents(request.contents),
  };

  if (config.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: config.systemInstruction }],
    };
  }

  if (config.tools) {
    payload.tools = config.tools;
  }

  if (config.toolConfig) {
    payload.toolConfig = config.toolConfig;
  }

  const generationConfig: Record<string, any> = {};
  if (config.temperature !== undefined) {
    generationConfig.temperature = config.temperature;
  }
  if (config.responseMimeType) {
    generationConfig.responseMimeType = config.responseMimeType;
  }
  if (Object.keys(generationConfig).length > 0) {
    payload.generationConfig = generationConfig;
  }

  return payload;
}

async function generateContentWithRetry(apiKey: string, request: any, maxAttempts = 3) {
  let lastError: unknown;
  const model = encodeURIComponent(request.model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const payload = buildGenerateContentPayload(request);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
      await sleep(400 * attempt);
    }
  }

  throw lastError;
}

async function runModelCall(apiKey: string, request: any) {
  const startedAt = Date.now();
  const response = await generateContentWithRetry(apiKey, request);
  return {
    response,
    durationMs: Date.now() - startedAt,
    telemetry: extractUsageTelemetry(response),
  };
}

function chunkTextForStreaming(text: string, maxChunkLength = 80) {
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let end = Math.min(text.length, cursor + maxChunkLength);
    if (end < text.length) {
      const breakpoint = text.lastIndexOf(" ", end);
      if (breakpoint > cursor + 20) {
        end = breakpoint + 1;
      }
    }
    chunks.push(text.slice(cursor, end));
    cursor = end;
  }

  return chunks.filter(Boolean);
}

async function streamTextToDraft(
  text: string,
  onDelta: (delta: string, fullText: string) => Promise<void>
) {
  const chunks = chunkTextForStreaming(text);
  let fullText = "";

  for (const chunk of chunks) {
    fullText += chunk;
    await onDelta(chunk, fullText);
    await sleep(18);
  }

  return { text: fullText };
}

function buildFallbackPlan(args: any) {
  const steps: any[] = [];

  if (args.programId) {
    steps.push({
      id: "s1",
      stepIndex: 0,
      groupId: "discover",
      toolName: "get_course_summary",
      purpose: "Load program course metrics and current status.",
      args: { program_id: args.programId },
    });
  } else {
    steps.push({
      id: "s1",
      stepIndex: 0,
      groupId: "discover",
      toolName: "get_program_overview",
      purpose: "Load department overview and program health.",
      args: { campus_id: args.campusId || "Main Campus" },
    });
  }

  steps.push({
    id: "s2",
    stepIndex: 0,
    groupId: "discover",
    toolName: "search_courses",
    purpose: "Find courses relevant to the request.",
    args: { program_id: args.programId || "ALL", keyword: deriveKeywordFromQuery(args.query) },
  });
  steps.push({
    id: "s3",
    stepIndex: 1,
    groupId: "ground",
    toolName: "search_curricular_policies",
    purpose: "Find policies that govern the recommendation.",
    args: { keyword: deriveKeywordFromQuery(args.query) },
    dependsOn: ["s2"],
    injectPriorResults: ["s2"],
  });
  steps.push({
    id: "s4",
    stepIndex: 1,
    groupId: "ground",
    toolName: "search_reviews",
    purpose: "Pull relevant course reviews and evaluations.",
    args: { query: args.query },
    dependsOn: ["s2"],
    injectPriorResults: ["s2"],
  });

  if (shouldUseWebSearch(args.query)) {
    steps.push({
      id: `s${steps.length + 1}`,
      stepIndex: 1,
      groupId: "external",
      toolName: "web_search",
      purpose: "Collect fresh external context when the question depends on current outside facts.",
      args: { query: args.query },
      model: PLANNER_MODEL_NAME,
      dependsOn: ["s2"],
      injectPriorResults: ["s2"],
    });
  }

  steps.push({
    id: `s${steps.length + 1}`,
    stepIndex: 2,
    groupId: "synthesize",
    toolName: "synthesize_report",
    purpose: "Combine all gathered evidence into an education-focused answer.",
    args: {},
    dependsOn: steps.map((step) => step.id),
    injectPriorResults: steps.map((step) => step.id),
    model: MODEL_NAME,
  });

  return {
    summary: "Fallback plan created from scope, query intent, and known curriculum data sources.",
    plan: steps,
    telemetry: {
      model: "fallback_planner",
      durationMs: 0,
    },
  };
}

async function buildHarnessPlan(apiKey: string, args: any, attachedFiles: any[], brief: any) {
  const attachmentSummary =
    attachedFiles.length > 0
      ? attachedFiles
          .map((file) => `${file.filename} (${file.fileCategory}, ${formatAttachmentSize(file.sizeBytes)})`)
          .join("; ")
      : "none";

  const prompt = `You are planning an education curriculum agent run.

Return JSON only with this shape:
{
  "summary": "short sentence",
  "steps": [
    {
      "id": "s1",
      "stepIndex": 0,
      "groupId": "discover",
      "toolName": "search_courses",
      "args": { "program_id": "CURRENT", "keyword": "machine learning prerequisites" },
      "purpose": "Find the relevant courses."
    }
  ]
}

Rules:
- Available toolName values: web_search, search_courses, search_curricular_policies, get_enrollment_data, get_faculty_summary, get_course_summary, get_program_overview, search_reviews, create_action_item, list_action_items
- Do not include synthesize_report; it is added automatically after execution.
- Use CURRENT for program_id or campus_id when the current scope should be used.
- Prefer internal tools first.
- Use web_search only when current external facts would materially improve the answer.
- Only use create_action_item when the user is explicitly asking to create or track something.
- Keep the plan compact: 2 to 5 execution steps before synthesis.

Scope:
- programId: ${args.programId || "none"}
- campusId: ${args.campusId || "none"}
- query: ${args.query}
- attachments: ${attachmentSummary}

Structured Convex brief:
${formatBriefForPrompt(brief, args.query)}`;

  try {
    const { response, durationMs, telemetry } = await runModelCall(apiKey, {
      model: PLANNER_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const rawText = extractAssistantText(response);
    const jsonBlock = extractFirstJsonBlock(rawText);
    if (!jsonBlock) {
      return buildFallbackPlan(args);
    }

    const parsed = JSON.parse(jsonBlock);
    const plan = Array.isArray(parsed?.steps) ? parsed.steps : [];
    if (plan.length === 0) {
      return buildFallbackPlan(args);
    }

    const normalized = plan
      .map((step: any, index: number) => ({
        id: typeof step?.id === "string" ? step.id : `s${index + 1}`,
        stepIndex: Number.isFinite(step?.stepIndex) ? step.stepIndex : 0,
        groupId: typeof step?.groupId === "string" ? step.groupId : "discover",
        toolName: step?.toolName,
        purpose:
          typeof step?.purpose === "string" && step.purpose.trim()
            ? step.purpose.trim()
            : `Run ${step?.toolName || "tool"}.`,
        args: {
          ...(step?.args ?? {}),
          program_id:
            step?.args?.program_id === "CURRENT" || step?.args?.program_id === "current"
              ? args.programId
              : step?.args?.program_id,
          campus_id:
            step?.args?.campus_id === "CURRENT" || step?.args?.campus_id === "current"
              ? args.campusId || "Main Campus"
              : step?.args?.campus_id,
        },
        dependsOn: Array.isArray(step?.dependsOn) ? step.dependsOn.filter(Boolean) : undefined,
        injectPriorResults: Array.isArray(step?.injectPriorResults)
          ? step.injectPriorResults.filter(Boolean)
          : undefined,
        model: typeof step?.model === "string" ? step.model : undefined,
      }))
      .filter((step: any) => typeof step.toolName === "string");

    if (!normalized.some((step: any) => step.toolName === "synthesize_report")) {
      normalized.push({
        id: `s${normalized.length + 1}`,
        stepIndex: Math.max(...normalized.map((step: any) => step.stepIndex), 0) + 1,
        groupId: "synthesize",
        toolName: "synthesize_report",
        purpose: "Combine all gathered evidence into an education-focused answer.",
        args: {},
        dependsOn: normalized.map((step: any) => step.id),
        injectPriorResults: normalized.map((step: any) => step.id),
        model: MODEL_NAME,
      });
    }

    return {
      summary:
        typeof parsed?.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : "Planner generated a compact harness run for this request.",
      plan: normalized,
      telemetry: {
        model: PLANNER_MODEL_NAME,
        durationMs,
        ...telemetry,
      },
    };
  } catch {
    return buildFallbackPlan(args);
  }
}

async function generateFallbackAnswer(
  _ctx: any,
  args: any,
  apiKey: string,
  attachedFiles: any[],
  brief: any
) {
  const prompt = `You are producing a curriculum-grounded answer for a university faculty member or department chair.

User query:
${args.query}

Context:
- Scope: ${args.programId ? `program ${args.programId}` : `campus ${args.campusId || "Main Campus"}`}
- Structured Convex brief:
${formatBriefForPrompt(brief, args.query)}
- Attached documents: ${
    attachedFiles.length
      ? attachedFiles
          .map(
            (file) =>
              `${file.filename} (${file.fileCategory}, ${formatAttachmentSize(file.sizeBytes)})`
          )
          .join("; ")
      : "none"
  }

Instructions:
- Answer with direct curriculum guidance.
- Reference exact course IDs, course codes, policy IDs, review IDs, and enrollment data when present.
- Use numbered steps in 1. 2. 3. form whenever action is needed.
- If there is a prerequisite chain issue, say so explicitly.
- If the brief contains a primary course, lead with that course ID first.
- If the brief contains policy-backed requirements, quote the concrete thresholds from the policy context when available.
- Only mention IDs, policies, courses, programs, and data that appear in the structured brief.
- Do not invent facts beyond the provided context.`;

  const { response, durationMs, telemetry } = await runModelCall(apiKey, {
    model: MODEL_NAME,
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  return {
    text: extractAssistantText(response),
    courses: brief.matchedCourses ?? [],
    policies: brief.policies ?? [],
    reviews: brief.reviews ?? [],
    metrics: brief.scope ?? {},
    telemetry: {
      model: MODEL_NAME,
      durationMs,
      ...telemetry,
    },
  };
}

export const chat = action({
  args: {
    operatorId: v.string(),
    query: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    sessionId: v.string(),
    senderName: v.optional(v.string()),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<ChatActionResult> => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Set GEMINI_API_KEY or GOOGLE_API_KEY in the Convex environment.");
    }

    let draftMessageId: any = null;
    let eventSequence = 0;
    const references = new Set<string>();
    const sourceUrls = new Set<string>();
    const sourceRefs = new Map<string, any>();
    const toolTrace: Array<any> = [];
    const modelTurns: Array<any> = [];
    let plannerResult: any = {
      summary: "",
      telemetry: {},
      plan: [],
    };
    let fallbackTelemetry: any = null;
    let qualityBrief: any = null;
    let qualityReport: any = null;
    let answerPacketId: string | null = null;

    const buildTracePayload = () => ({
      planner: {
        summary: plannerResult.summary,
        telemetry: plannerResult.telemetry,
        plan: plannerResult.plan,
      },
      execution: {
        steps: toolTrace,
        modelTurns,
        totalDurationMs:
          toolTrace.reduce((sum, step) => sum + (step.durationMs ?? 0), 0) +
          modelTurns.reduce((sum, turn) => sum + (turn.durationMs ?? 0), 0),
        fallbackUsed: Boolean(fallbackTelemetry),
      },
      sources: Array.from(sourceRefs.values()),
      telemetry: {
        planning: plannerResult.telemetry,
        modelTurns,
        fallback: fallbackTelemetry,
      },
    });

    const buildMessageMetadata = () => ({
      model: MODEL_NAME,
      operatorId: args.operatorId,
      answerPacketId,
      quality: qualityReport
        ? {
            status: qualityReport.status,
            summary: qualityReport.summary,
            checks: qualityReport.checks,
          }
        : undefined,
      trace: buildTracePayload(),
    });

    const syncDraft = async (options?: {
      content?: string;
      appendText?: string;
      status?: string;
    }) => {
      if (!draftMessageId) {
        return;
      }
      await ctx.runMutation(api.messages.updateAssistantDraft, {
        messageId: draftMessageId,
        updatedAt: Date.now(),
        content: options?.content,
        appendText: options?.appendText,
        status: options?.status,
        references: Array.from(references),
        sourceUrls: Array.from(sourceUrls),
        metadataJson: safeJsonStringify(buildMessageMetadata()),
      });
    };

    const appendStreamEvent = async (
      eventType: string,
      summary: string,
      payload?: Record<string, unknown>
    ) => {
      if (!draftMessageId) {
        return;
      }
      eventSequence += 1;
      await ctx.runMutation(api.messages.appendEvent, {
        messageId: draftMessageId,
        sessionId: args.sessionId,
        programId: args.programId,
        campusId: args.campusId,
        eventType,
        sequence: eventSequence,
        summary,
        payloadJson: payload ? safeJsonStringify(payload) : undefined,
        createdAt: Date.now(),
      });
    };

    try {
      if (args.programId) {
        await ctx.runQuery(api.programs.getById, {
          operatorId: args.operatorId,
          programId: args.programId,
        });
      } else if (args.campusId) {
        await ctx.runQuery(api.programs.getByCampus, {
          operatorId: args.operatorId,
          campusId: args.campusId,
        });
      }

      const existingMessages = await ctx.runQuery(api.messages.getBySession, {
        operatorId: args.operatorId,
        sessionId: args.sessionId,
        programId: args.programId,
        campusId: args.campusId,
      });
      const attachedFiles =
        args.fileIds && args.fileIds.length > 0
          ? await ctx.runQuery(api.files.getByIds, {
              operatorId: args.operatorId,
              fileIds: args.fileIds,
              programId: args.programId,
              campusId: args.campusId,
            })
          : [];
      qualityBrief = await ctx.runQuery(api.briefs.getAgentBrief, {
        operatorId: args.operatorId,
        query: args.query,
        programId: args.programId,
        campusId: args.campusId,
      });
      collectBriefReferences(references, qualityBrief);
      const userTimestamp = Date.now();

      await ctx.runMutation(api.messages.send, {
        role: "user",
        content: args.query,
        senderName: args.senderName,
        status: "completed",
        programId: args.programId,
        campusId: args.campusId,
        sessionId: args.sessionId,
        createdAt: userTimestamp,
        updatedAt: userTimestamp,
        fileIds: args.fileIds,
        metadataJson: JSON.stringify({
          operatorId: args.operatorId,
        }),
      });

      draftMessageId = await ctx.runMutation(api.messages.createDraftAssistant, {
        sessionId: args.sessionId,
        programId: args.programId,
        campusId: args.campusId,
        createdAt: Date.now(),
        metadataJson: safeJsonStringify({
          model: MODEL_NAME,
          operatorId: args.operatorId,
          trace: buildTracePayload(),
        }),
      });

      await appendStreamEvent("run.started", "Run started", {
        query: args.query,
      });

      const systemPrompt = args.programId
        ? `You are a Course Planning Assistant for a university computer science department. The user is a professor for program ${args.programId}. Prefer internal tools for course data, enrollment, reviews, and curricular policies. Use Google Search only when current external information materially improves the answer. Reference exact course IDs, course codes, policy IDs, enrollment figures, and concrete next steps. Distinguish immediate actions from long-term curriculum changes. Create action items when the answer clearly requires tracked execution. When reviewing courses, reference student evaluation scores, peer review findings, and accreditation requirements.`
        : `You are a Department Curriculum Assistant. The user is the department chair for campus ${args.campusId || "Main Campus"}. Prefer internal tools for course data, enrollment, reviews, and curricular policies. Use Google Search only when current external information materially improves the answer. Identify cross-program patterns, quantify curriculum gaps, recommend prioritized actions, and create action items when multi-program follow-up is needed. Monitor faculty load balance and accreditation compliance across programs.`;

      plannerResult = await buildHarnessPlan(apiKey, args, attachedFiles, qualityBrief);
      await appendStreamEvent("plan.created", `Planned ${plannerResult.plan.length} steps`, {
        summary: plannerResult.summary,
        steps: plannerResult.plan,
      });
      await syncDraft({ status: "streaming" });
      const historyContents = buildHistoryContents(existingMessages);
      const attachmentContext = await buildAttachmentContext(ctx, attachedFiles);
      const currentUserText =
        attachedFiles.length > 0
          ? `${args.query}\n\nAttached documents:\n${attachmentContext.summaries.join("\n")}\nUse attached documents when they inform the recommendation.`
          : args.query;
      const contents: any[] = [
        ...historyContents,
        {
          role: "user",
          parts: [{ text: currentUserText }, ...attachmentContext.parts],
        },
      ];

      let assistantMessage = "";
      const plannedLookup = new Map<string, any>(
        plannerResult.plan
          .filter((step: any) => step.toolName !== "synthesize_report")
          .map((step: any) => [step.toolName, step])
      );

      if (attachedFiles.length > 0) {
        toolTrace.push({
          id: "attachments",
          stepIndex: -1,
          groupId: "input",
          tool: "attachments",
          purpose: "Attach uploaded documents to the run context.",
          durationMs: 0,
          success: true,
          summary: attachmentContext.summaries.join(" | ").slice(0, 220),
          telemetry: {},
        });
        await appendStreamEvent("attachments.bound", `Bound ${attachedFiles.length} attachments`, {
          summaries: attachmentContext.summaries,
        });
        await syncDraft();
      }

      for (let i = 0; i < 5; i++) {
        const { response, durationMs, telemetry } = await runModelCall(apiKey, {
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction: systemPrompt,
            tools: TOOLS,
            temperature: 0.4,
            toolConfig: {
              includeServerSideToolInvocations: true,
            },
          },
        });

        modelTurns.push({
          turn: i + 1,
          durationMs,
          model: MODEL_NAME,
          ...telemetry,
        });
        await appendStreamEvent("model.turn.completed", `Completed reasoning turn ${i + 1}`, {
          turn: i + 1,
          durationMs,
          telemetry,
        });

        assistantMessage = extractAssistantText(response);
        const groundedSources = extractGroundingSources(response);
        if (groundedSources.length) {
          for (const source of groundedSources) {
            sourceUrls.add(source.url);
            sourceRefs.set(source.url, source);
          }
          toolTrace.push({
            id: `google-search-${i + 1}`,
            stepIndex: 1,
            groupId: "external",
            tool: "web_search",
            purpose: "Gathered externally grounded sources through Gemini Google Search.",
            durationMs,
            success: true,
            summary: `${groundedSources.length} grounded sources`,
            telemetry: {
              model: MODEL_NAME,
              ...telemetry,
            },
            sources: groundedSources,
          });
          await appendStreamEvent("sources.updated", `Captured ${groundedSources.length} grounded sources`, {
            sources: groundedSources,
          });
          await syncDraft();
        }

        const functionCalls = extractFunctionCalls(response);
        const candidateContent = response.candidates?.[0]?.content;

        if (functionCalls.length === 0) {
          break;
        }

        if (candidateContent) {
          contents.push(candidateContent);
        }

        const functionResponses = [];

        for (const call of functionCalls) {
          const toolName = call.name;
          const toolArgs = (call.args ?? {}) as Record<string, any>;
          let result: unknown;
          const toolStartedAt = Date.now();
          await appendStreamEvent("step.started", `Running ${toolName ?? "tool"}`, {
            toolName,
            args: toolArgs,
          });

          try {
            switch (toolName) {
              case "search_courses":
                result = await ctx.runQuery(api.courses.search, {
                  operatorId: args.operatorId,
                  programId: toolArgs.program_id === "ALL" ? undefined : toolArgs.program_id,
                  type: toolArgs.type,
                  status: toolArgs.status,
                  keyword: toolArgs.keyword,
                });
                break;
              case "search_curricular_policies":
                result = await ctx.runQuery(api.curricularPolicies.search, {
                  policyId: toolArgs.policy_id,
                  keyword: toolArgs.keyword,
                });
                break;
              case "get_enrollment_data":
                result = await ctx.runQuery(api.enrollment.getByCourse, {
                  courseId: toolArgs.course_id,
                  semester: toolArgs.semester,
                });
                break;
              case "get_faculty_summary":
                result = await ctx.runQuery(api.faculty.getByProgram, {
                  operatorId: args.operatorId,
                  programId: toolArgs.program_id,
                });
                break;
              case "get_course_summary":
                result = await ctx.runQuery(api.operations.getCourseMetrics, {
                  operatorId: args.operatorId,
                  programId: toolArgs.program_id,
                });
                break;
              case "get_program_overview":
                result = await ctx.runQuery(api.operations.getDepartmentSummary, {
                  operatorId: args.operatorId,
                  campusId: toolArgs.campus_id,
                });
                break;
              case "search_reviews":
                result = await ctx.runQuery(api.reviews.search, {
                  courseId: toolArgs.course_id,
                  type: toolArgs.type,
                  query: toolArgs.query,
                });
                break;
              case "create_action_item":
                result = await ctx.runMutation(api.actionItems.create, {
                  operatorId: args.operatorId,
                  courseId: toolArgs.course_id,
                  programId: toolArgs.program_id,
                  campusId: toolArgs.campus_id,
                  title: toolArgs.title,
                  description: toolArgs.description,
                  assignee: toolArgs.assignee,
                  priority: toolArgs.priority,
                  status: "open",
                  source: "agent",
                  dueAt: toolArgs.due_at,
                });
                break;
              case "list_action_items":
                result = await ctx.runQuery(api.actionItems.list, {
                  operatorId: args.operatorId,
                  programId: toolArgs.program_id,
                  campusId: toolArgs.campus_id,
                });
                break;
              default:
                result = { error: `Unknown tool: ${toolName}` };
            }
          } catch (error: any) {
            result = { error: error.message };
          }

          if (Array.isArray(result)) {
            for (const item of result) {
              appendReference(references, item.courseId);
              appendReference(references, item.courseCode);
              appendReference(references, item.policyId);
              appendReference(references, item.reviewId);
              appendReference(references, item.actionItemId);
              appendReference(references, item.programId);
              appendReference(references, item.facultyId);
            }
          } else if (result && typeof result === "object") {
            appendReference(references, (result as any).courseId);
            appendReference(references, (result as any).policyId);
            appendReference(references, (result as any).reviewId);
            appendReference(references, (result as any).actionItemId);
            appendReference(references, (result as any).programId);
          }

          const plannedStep = plannedLookup.get(toolName ?? "");
          toolTrace.push({
            id: call.id || `${toolName}-${i + 1}-${toolTrace.length + 1}`,
            stepIndex: plannedStep?.stepIndex ?? i,
            groupId: plannedStep?.groupId ?? "execute",
            tool: toolName ?? "unknown_tool",
            purpose: plannedStep?.purpose ?? `Run ${toolName ?? "tool"}.`,
            plannedArgs: plannedStep?.args,
            actualArgs: toolArgs,
            dependsOn: plannedStep?.dependsOn,
            injectPriorResults: plannedStep?.injectPriorResults,
            durationMs: Date.now() - toolStartedAt,
            success: !(result && typeof result === "object" && "error" in (result as any)),
            summary: summarizeResult(result),
            telemetry: {},
          });
          await appendStreamEvent(
            "step.completed",
            `${toolName ?? "tool"} ${result && typeof result === "object" && "error" in (result as any) ? "failed" : "completed"}`,
            {
              step: toolTrace[toolTrace.length - 1],
            }
          );
          await syncDraft();

          functionResponses.push({
            functionResponse: {
              name: toolName,
              id: call.id,
              response: { output: result },
            },
          });
        }

        contents.push({
          role: "user",
          parts: functionResponses,
        });
      }

      let finalAnswer = "";
      const deterministicAnswer = buildDeterministicAnswer(args, qualityBrief);
      if (!assistantMessage.trim()) {
        if (shouldUseDeterministicAnswer(args.query, qualityBrief, sourceRefs.size > 0) && deterministicAnswer) {
          assistantMessage = deterministicAnswer;
          finalAnswer = deterministicAnswer;
          toolTrace.push({
            id: "deterministic_synthesis",
            stepIndex: plannerResult.plan.length,
            groupId: "synthesize",
            tool: "deterministic_synthesis",
            purpose: "Generate a policy-backed answer directly from the structured Convex brief for high-confidence curriculum questions.",
            durationMs: 0,
            success: true,
            summary: "Rendered deterministic answer from course data and linked policy.",
            telemetry: { mode: "deterministic" },
          });
          await appendStreamEvent(
            "synthesis.completed",
            "Completed deterministic synthesis",
            { mode: "deterministic" }
          );
        } else {
          const fallback = await generateFallbackAnswer(
            ctx,
            args,
            apiKey,
            attachedFiles,
            qualityBrief
          );
          assistantMessage = fallback.text;
          finalAnswer = fallback.text;
          fallbackTelemetry = fallback.telemetry;
          for (const course of fallback.courses ?? []) {
            appendReference(references, course.courseId);
            appendReference(references, course.courseCode);
          }
          for (const policy of fallback.policies ?? []) {
            appendReference(references, policy.policyId);
          }
          for (const review of fallback.reviews ?? []) {
            appendReference(references, review.reviewId);
          }
          toolTrace.push({
            id: "fallback_synthesis",
            stepIndex: plannerResult.plan.length,
            groupId: "synthesize",
            tool: "fallback_synthesis",
            purpose: "Produce a final answer from internal data when the main generation path returns no text.",
            durationMs: fallback.telemetry?.durationMs ?? 0,
            success: true,
            summary: `courses=${fallback.courses.length}, policies=${fallback.policies.length}, reviews=${fallback.reviews.length}`,
            telemetry: fallback.telemetry,
          });
          await appendStreamEvent("synthesis.completed", "Completed fallback synthesis", {
            telemetry: fallback.telemetry,
          });
        }
        await syncDraft({
          content: finalAnswer,
          status: "completed",
        });
      } else {
        const synthesisPrompt = `${
          args.programId
            ? `You are finalizing a streaming answer for the professor of ${args.programId}.`
            : `You are finalizing a streaming answer for the department chair of ${args.campusId || "Main Campus"}.`
        }

Use the draft answer and execution evidence below to produce the final education-focused response.
- Keep all claims grounded in the provided evidence.
- Prefer concise markdown with headings or bullets only when helpful.
- Mention internal references such as course IDs, course codes, policy IDs, and review IDs when relevant.
- If external sources were gathered, rely only on those source summaries for current external claims.
- Lead with the most relevant course or curriculum gap when one exists in the Convex brief.
- Mention concrete enrollment figures, completion rates, faculty loads, or scores when they exist in the brief.
- Only mention IDs, policies, courses, programs, and data that appear in the Convex brief or execution evidence below.
- When action is required, format the immediate response as a numbered list using 1. 2. 3.
- Do not mention hidden system mechanics or internal metadata structures.

Original user request:
${args.query}

Planner summary:
${plannerResult.summary || "n/a"}

Structured Convex brief:
${formatBriefForPrompt(qualityBrief, args.query)}

Execution summary:
${toolTrace
  .map(
    (step) =>
      `- ${step.tool}: ${step.summary}${step.success === false ? " (failed)" : ""}`
  )
  .join("\n")}

External sources:
${Array.from(sourceRefs.values())
  .map((source: any) => `- ${source.title || source.domain} (${source.domain})`)
  .join("\n") || "- none"}

Draft answer to refine:
${assistantMessage}`;

        await appendStreamEvent("synthesis.started", "Streaming final answer", {
          seedLength: assistantMessage.length,
        });
        await syncDraft({ content: "", status: "streaming" });

        const synthesis = await runModelCall(apiKey, {
          model: MODEL_NAME,
          contents: synthesisPrompt,
          config: {
            temperature: 0.3,
          },
        });

        modelTurns.push({
          turn: modelTurns.length + 1,
          durationMs: synthesis.durationMs,
          model: MODEL_NAME,
          phase: "synthesis",
          ...synthesis.telemetry,
        });
        finalAnswer =
          shouldUseDeterministicAnswer(args.query, qualityBrief, sourceRefs.size > 0) &&
          deterministicAnswer
            ? deterministicAnswer
            : extractAssistantText(synthesis.response).trim() || assistantMessage;
        if (!deterministicAnswer && answerNeedsCoverageFallback(finalAnswer, qualityBrief)) {
          const fallback = await generateFallbackAnswer(
            ctx,
            args,
            apiKey,
            attachedFiles,
            qualityBrief
          );
          finalAnswer = fallback.text;
          fallbackTelemetry = fallback.telemetry;
          toolTrace.push({
            id: "coverage_fallback_synthesis",
            stepIndex: plannerResult.plan.length + 1,
            groupId: "synthesize",
            tool: "coverage_fallback_synthesis",
            purpose: "Regenerate the answer from the structured Convex brief when the drafted answer omits required grounded details.",
            durationMs: fallback.telemetry?.durationMs ?? 0,
            success: true,
            summary: `courses=${fallback.courses.length}, policies=${fallback.policies.length}, reviews=${fallback.reviews.length}`,
            telemetry: fallback.telemetry,
          });
          await appendStreamEvent(
            "coverage.fallback",
            "Upgraded answer from structured Convex brief",
            {
              telemetry: fallback.telemetry,
            }
          );
        }
        await streamTextToDraft(finalAnswer, async (delta) => {
          await ctx.runMutation(api.messages.updateAssistantDraft, {
            messageId: draftMessageId,
            appendText: delta,
            updatedAt: Date.now(),
          });
        });
        await appendStreamEvent("synthesis.completed", "Completed streamed synthesis", {
          durationMs: synthesis.durationMs,
          telemetry: synthesis.telemetry,
        });
        await syncDraft({
          content: finalAnswer,
          status: "completed",
        });
      }

      const tracePayload = buildTracePayload();
      qualityReport = buildQualityReport(
        finalAnswer,
        args.query,
        qualityBrief,
        references,
        sourceRefs
      );

      await appendStreamEvent("quality.checked", `Quality status: ${qualityReport.status}`, {
        quality: qualityReport,
      });

      const answerPacket: { answerPacketId: string } = await ctx.runMutation(internal.answerPackets.create, {
        answerPacketId: makeRuntimeId("ANS"),
        messageId: draftMessageId,
        sessionId: args.sessionId,
        operatorId: args.operatorId,
        programId: args.programId,
        campusId: args.campusId,
        query: args.query,
        answer: finalAnswer,
        references: Array.from(references),
        sourceUrls: Array.from(sourceUrls),
        qualityStatus: qualityReport.status,
        qualitySummary: qualityReport.summary,
        qualityChecksJson: safeJsonStringify(qualityReport.checks),
        briefJson: safeJsonStringify(qualityBrief),
        traceJson: safeJsonStringify(tracePayload),
        model: MODEL_NAME,
        createdAt: Date.now(),
      });
      answerPacketId = answerPacket.answerPacketId;

      await appendStreamEvent("answer.packet.created", `Stored ${answerPacketId}`, {
        answerPacketId,
        qualityStatus: qualityReport.status,
      });

      await appendStreamEvent("run.completed", "Run completed", {
        planStepCount: plannerResult.plan.length,
        sourceUrlCount: sourceUrls.size,
        answerPacketId,
        qualityStatus: qualityReport.status,
      });
      await syncDraft({
        content: finalAnswer,
        status: "completed",
      });

      await ctx.runMutation(internal.audit.record, {
        actorId: args.operatorId,
        eventType: "agent.chat.completed",
        status: "success",
        programId: args.programId,
        campusId: args.campusId,
        entityId: args.sessionId,
        summary: `Completed assistant response for ${args.programId ?? args.campusId ?? "global"} scope.`,
        detailsJson: safeJsonStringify({
          references: Array.from(references),
          sourceUrlCount: sourceUrls.size,
          planStepCount: plannerResult.plan.length,
          answerPacketId,
          qualityStatus: qualityReport.status,
          qualitySummary: qualityReport.summary,
          toolTrace,
        }),
      });

      return {
        answer: finalAnswer,
        trace: tracePayload,
        messageId: draftMessageId,
        answerPacketId,
        quality: qualityReport,
      };
    } catch (error: any) {
      if (draftMessageId) {
        await appendStreamEvent("run.failed", "Run failed", {
          message: error?.message ?? "Unknown agent failure",
        });
        await syncDraft({
          status: "failed",
        });
      }
      await ctx.runMutation(internal.audit.record, {
        actorId: args.operatorId,
        eventType: "agent.chat.completed",
        status: "failure",
        programId: args.programId,
        campusId: args.campusId,
        entityId: args.sessionId,
        summary: `Assistant request failed for ${args.programId ?? args.campusId ?? "global"} scope.`,
        detailsJson: safeJsonStringify({
          message: error?.message ?? "Unknown agent failure",
        }),
      });
      throw error;
    }
  },
});
