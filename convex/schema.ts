import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    operatorId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    programIds: v.array(v.string()),
    campusIds: v.array(v.string()),
  }).index("by_operatorId", ["operatorId"])
    .index("by_role", ["role"]),

  programs: defineTable({
    programId: v.string(),
    name: v.string(),
    department: v.string(),
    degreeType: v.string(),
    accreditationStatus: v.string(),
    totalCredits: v.number(),
    campus: v.string(),
    chairId: v.optional(v.string()),
  }).index("by_campus", ["campus"])
    .index("by_programId", ["programId"])
    .index("by_department", ["department"]),

  courses: defineTable({
    courseId: v.string(),
    programId: v.string(),
    courseCode: v.string(),
    title: v.string(),
    credits: v.number(),
    description: v.string(),
    type: v.string(),
    status: v.string(),
    prerequisites: v.array(v.string()),
    semester: v.string(),
    enrollmentCap: v.number(),
    learningOutcomes: v.array(v.string()),
    instructorName: v.optional(v.string()),
  }).index("by_program", ["programId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_courseCode", ["courseCode"])
    .index("by_courseId", ["courseId"]),

  enrollment: defineTable({
    courseId: v.string(),
    semester: v.string(),
    enrolled: v.number(),
    capacity: v.number(),
    waitlist: v.number(),
    completionRate: v.number(),
    avgGrade: v.number(),
    dropRate: v.number(),
  }).index("by_course", ["courseId"])
    .index("by_semester", ["semester"])
    .index("by_course_semester", ["courseId", "semester"]),

  faculty: defineTable({
    facultyId: v.string(),
    programId: v.string(),
    name: v.string(),
    expertise: v.array(v.string()),
    courseLoad: v.number(),
    maxLoad: v.number(),
    rank: v.string(),
    status: v.string(),
  }).index("by_program", ["programId"])
    .index("by_facultyId", ["facultyId"])
    .index("by_status", ["status"]),

  curricularPolicies: defineTable({
    policyId: v.string(),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    accreditationBody: v.string(),
    effectiveDate: v.string(),
  }).index("by_policyId", ["policyId"])
    .index("by_category", ["category"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"],
    }),

  reviews: defineTable({
    reviewId: v.string(),
    courseId: v.string(),
    type: v.string(),
    findings: v.string(),
    recommendations: v.string(),
    semester: v.string(),
    score: v.number(),
  }).index("by_course", ["courseId"])
    .index("by_type", ["type"])
    .index("by_reviewId", ["reviewId"])
    .searchIndex("search_findings", {
      searchField: "findings",
      filterFields: ["type"],
    }),

  actionItems: defineTable({
    actionItemId: v.string(),
    courseId: v.optional(v.string()),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    assignee: v.string(),
    priority: v.string(),
    status: v.string(),
    source: v.string(),
    dueAt: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  }).index("by_program", ["programId"])
    .index("by_campus", ["campusId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_course", ["courseId"]),

  files: defineTable({
    fileId: v.string(),
    courseId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    fileCategory: v.string(),
    sizeBytes: v.number(),
    storageId: v.optional(v.id("_storage")),
    uploadedBy: v.string(),
    uploadedAt: v.string(),
    analysisStatus: v.optional(v.string()),
    summary: v.optional(v.string()),
  }).index("by_course", ["courseId"])
    .index("by_session", ["sessionId"])
    .index("by_program", ["programId"])
    .index("by_campus", ["campusId"])
    .index("by_fileId", ["fileId"]),

  messages: defineTable({
    role: v.string(),
    content: v.string(),
    senderName: v.optional(v.string()),
    status: v.optional(v.string()),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    sessionId: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    references: v.optional(v.array(v.string())),
    sourceUrls: v.optional(v.array(v.string())),
    fileIds: v.optional(v.array(v.string())),
    metadataJson: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  messageEvents: defineTable({
    messageId: v.id("messages"),
    sessionId: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    eventType: v.string(),
    sequence: v.number(),
    summary: v.string(),
    payloadJson: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"])
    .index("by_message", ["messageId"])
    .index("by_session_sequence", ["sessionId", "sequence"]),

  answerPackets: defineTable({
    answerPacketId: v.string(),
    messageId: v.optional(v.id("messages")),
    sessionId: v.string(),
    operatorId: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    query: v.string(),
    answer: v.string(),
    references: v.array(v.string()),
    sourceUrls: v.array(v.string()),
    qualityStatus: v.string(),
    qualitySummary: v.optional(v.string()),
    qualityChecksJson: v.string(),
    briefJson: v.optional(v.string()),
    traceJson: v.optional(v.string()),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_answerPacketId", ["answerPacketId"])
    .index("by_message", ["messageId"])
    .index("by_session", ["sessionId"])
    .index("by_session_createdAt", ["sessionId", "createdAt"])
    .index("by_program", ["programId"])
    .index("by_campus", ["campusId"]),

  evalRuns: defineTable({
    evalRunId: v.string(),
    dataset: v.string(),
    model: v.string(),
    limit: v.number(),
    status: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    summaryJson: v.optional(v.string()),
  }).index("by_evalRunId", ["evalRunId"])
    .index("by_status", ["status"])
    .index("by_startedAt", ["startedAt"]),

  evalCases: defineTable({
    evalRunId: v.string(),
    caseId: v.string(),
    scenario: v.string(),
    query: v.string(),
    responsePreview: v.string(),
    refScore: v.number(),
    foundRefs: v.array(v.string()),
    missingRefs: v.array(v.string()),
    criteriaResultsJson: v.string(),
    judgeScoresJson: v.string(),
    sessionId: v.optional(v.string()),
    messageId: v.optional(v.id("messages")),
    answerPacketId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_evalRunId", ["evalRunId"])
    .index("by_evalRun_caseId", ["evalRunId", "caseId"]),

  eventLogs: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    status: v.string(),
    actorId: v.string(),
    actorName: v.string(),
    actorRole: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    summary: v.string(),
    detailsJson: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_eventId", ["eventId"])
    .index("by_program", ["programId"])
    .index("by_campus", ["campusId"])
    .index("by_actor", ["actorId"]),
});
