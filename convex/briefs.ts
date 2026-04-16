import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireCampusAccess, requireProgramAccess } from "./access";

function tokenizeQuery(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3)
    )
  );
}

function extractReferenceMatches(query: string) {
  const refs = query.match(/\b(?:CRS|POL|PRG|FAC|REV)-[A-Z0-9-]+\b/gi) ?? [];
  return new Set(refs.map((ref) => ref.toUpperCase()));
}

function rankCourse(course: any, tokens: string[], refs: Set<string>) {
  const haystack = [
    course.courseId,
    course.courseCode,
    course.title,
    course.description,
    course.type,
    course.status,
    course.programId,
    ...(course.learningOutcomes ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  if (refs.has(String(course.courseId).toUpperCase())) score += 20;
  if (refs.has(String(course.courseCode).toUpperCase())) score += 15;
  if (refs.has(String(course.programId).toUpperCase())) score += 8;
  if (course.status !== "deprecated") score += 3;
  if (course.status === "under_review") score += 4;
  if (course.type === "core") score += 2;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function rankPolicy(policy: any, tokens: string[], refs: Set<string>) {
  const haystack = [policy.policyId, policy.title, policy.content, policy.category, policy.accreditationBody]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = 0;
  if (refs.has(String(policy.policyId).toUpperCase())) score += 20;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }
  return score;
}

function rankEnrollment(item: any, tokens: string[], refs: Set<string>) {
  const haystack = [item.courseId, item.semester]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = item.enrolled < item.capacity * 0.5 ? 3 : 0;
  if (refs.has(String(item.courseId).toUpperCase())) score += 15;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }
  return score;
}

export const getAgentBrief = query({
  args: {
    operatorId: v.string(),
    query: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    } else {
      await requireCampusAccess(ctx, args.operatorId, args.campusId ?? "Main Campus");
    }

    const tokens = tokenizeQuery(args.query);
    const refs = extractReferenceMatches(args.query);
    const includeReviews =
      /\breview\b|\bfeedback\b|\beval\b|\baccreditation\b|\baudit\b|\bgap\b|\bstudent\b|\bscore\b/i.test(
        args.query
      );
    const campusId = args.campusId ?? "Main Campus";

    const programs = args.programId
      ? [
          await ctx.db
            .query("programs")
            .withIndex("by_programId", (q: any) => q.eq("programId", args.programId))
            .first(),
        ].filter(Boolean)
      : await ctx.db
          .query("programs")
          .withIndex("by_campus", (q: any) => q.eq("campus", campusId))
          .collect();

    const programIds = new Set(programs.map((p: any) => p.programId));
    let courses = await ctx.db.query("courses").collect();
    courses = courses.filter(
      (c: any) => args.programId ? c.programId === args.programId : programIds.has(c.programId)
    );

    const rankedCourses = courses
      .map((course: any) => ({ course, score: rankCourse(course, tokens, refs) }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score);

    const matchedCourses = rankedCourses.slice(0, 5).map((entry: any) => entry.course);
    const matchedCourseIds = new Set(matchedCourses.map((c: any) => c.courseId));

    const crossProgramCourses = courses
      .filter((c: any) => !matchedCourseIds.has(c.courseId))
      .filter((c: any) => {
        const prereqs = new Set(c.prerequisites ?? []);
        return matchedCourses.some(
          (mc: any) =>
            prereqs.has(mc.courseCode) ||
            mc.prerequisites?.includes(c.courseCode)
        );
      })
      .slice(0, 6);

    const allPolicies = await ctx.db.query("curricularPolicies").collect();
    const policies = allPolicies
      .map((policy: any) => ({
        policy,
        score: rankPolicy(policy, tokens, refs),
      }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 6)
      .map((entry: any) => entry.policy);

    const enrollment = args.programId
      ? (await ctx.db.query("enrollment").collect()).filter((e: any) =>
          matchedCourseIds.has(e.courseId) || courses.some((c: any) => c.courseId === e.courseId)
        )
      : [];
    const enrollmentHighlights = enrollment
      .map((item: any) => ({ item, score: rankEnrollment(item, tokens, refs) }))
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((entry: any) => entry.item);

    const faculty = args.programId
      ? await ctx.db
          .query("faculty")
          .withIndex("by_program", (q: any) => q.eq("programId", args.programId))
          .collect()
      : [];
    const overloadedFaculty = faculty.filter((f: any) => f.courseLoad >= f.maxLoad);

    const reviews = includeReviews
      ? (await ctx.db.query("reviews").collect())
          .filter((review: any) => {
            if (matchedCourses.length === 0) {
              return tokens.some((token) =>
                `${review.findings} ${review.recommendations}`
                  .toLowerCase()
                  .includes(token)
              );
            }
            return matchedCourseIds.has(review.courseId);
          })
          .slice(0, 4)
      : [];

    const activeCourseCount = courses.filter((c: any) => c.status === "active").length;
    const underReviewCount = courses.filter((c: any) => c.status === "under_review").length;

    return {
      scope: {
        programId: args.programId,
        campusId,
        activeCourseCount,
        underReviewCount,
      },
      programs,
      matchedCourses,
      crossProgramCourses,
      policies,
      enrollmentHighlights,
      faculty,
      overloadedFaculty,
      reviews,
    };
  },
});
