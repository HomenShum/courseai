import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireCampusAccess, requireProgramAccess } from "./access";

export const getCourseMetrics = query({
  args: { operatorId: v.string(), programId: v.string() },
  handler: async (ctx, args) => {
    await requireProgramAccess(ctx, args.operatorId, args.programId);
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_program", (q: any) => q.eq("programId", args.programId))
      .collect();
    const enrollment = await ctx.db.query("enrollment").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const faculty = await ctx.db
      .query("faculty")
      .withIndex("by_program", (q: any) => q.eq("programId", args.programId))
      .collect();

    const courseIds = new Set(courses.map((c: any) => c.courseId));
    const programEnrollment = enrollment.filter((e: any) => courseIds.has(e.courseId));
    const programReviews = reviews.filter((r: any) => courseIds.has(r.courseId));

    const activeCourses = courses.filter((c: any) => c.status === "active");
    const underReview = courses.filter((c: any) => c.status === "under_review");
    const proposed = courses.filter((c: any) => c.status === "proposed");

    const latestEnrollment = programEnrollment.filter((e: any) => e.semester === "Fall 2026");
    const avgCompletionRate = latestEnrollment.length > 0
      ? latestEnrollment.reduce((sum: number, e: any) => sum + e.completionRate, 0) / latestEnrollment.length
      : 0;
    const avgUtilization = latestEnrollment.length > 0
      ? latestEnrollment.reduce((sum: number, e: any) => sum + (e.enrolled / e.capacity), 0) / latestEnrollment.length
      : 0;

    const overloadedFaculty = faculty.filter((f: any) => f.courseLoad >= f.maxLoad);
    const pendingReviews = programReviews.filter((r: any) =>
      r.type === "accreditation_audit" || r.type === "curriculum_gap"
    );

    return {
      programId: args.programId,
      activeCourseCount: activeCourses.length,
      underReviewCount: underReview.length,
      proposedCount: proposed.length,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      avgUtilization: Math.round(avgUtilization * 100) / 100,
      overloadedFacultyCount: overloadedFaculty.length,
      pendingReviewCount: pendingReviews.length,
      faculty,
    };
  },
});

export const getDepartmentSummary = query({
  args: { operatorId: v.string(), campusId: v.string() },
  handler: async (ctx, args) => {
    await requireCampusAccess(ctx, args.operatorId, args.campusId);
    const programs = await ctx.db.query("programs").collect();
    const filteredPrograms = args.campusId === "ALL"
      ? programs
      : programs.filter((p: any) => p.campus === args.campusId);
    const programIds = new Set(filteredPrograms.map((p: any) => p.programId));

    const courses = (await ctx.db.query("courses").collect()).filter(
      (c: any) => programIds.has(c.programId)
    );
    const enrollment = await ctx.db.query("enrollment").collect();
    const faculty = (await ctx.db.query("faculty").collect()).filter(
      (f: any) => programIds.has(f.programId)
    );
    const reviews = await ctx.db.query("reviews").collect();
    const actionItems = (await ctx.db.query("actionItems").collect()).filter(
      (item: any) => item.campusId === args.campusId || programIds.has(item.programId)
    );

    const courseIds = new Set(courses.map((c: any) => c.courseId));
    const activeCourses = courses.filter((c: any) => c.status === "active");
    const underReview = courses.filter((c: any) => c.status === "under_review");
    const deprecated = courses.filter((c: any) => c.status === "deprecated");

    const courseTypeDistribution = activeCourses.reduce((acc: Record<string, number>, c: any) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    }, {});

    const overloadedFaculty = faculty.filter((f: any) => f.courseLoad >= f.maxLoad);
    const gapReviews = reviews.filter(
      (r: any) => courseIds.has(r.courseId) && r.type === "curriculum_gap"
    );

    return {
      campusId: args.campusId,
      programCount: filteredPrograms.length,
      activeCourseCount: activeCourses.length,
      underReviewCount: underReview.length,
      deprecatedCount: deprecated.length,
      actionItemCount: actionItems.filter((item: any) => item.status !== "completed").length,
      overloadedFacultyCount: overloadedFaculty.length,
      curriculumGapCount: gapReviews.length,
      courseTypeDistribution,
    };
  },
});
