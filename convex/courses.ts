import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireCourseAccess, requireCampusAccess, requireProgramAccess } from "./access";

export const getById = query({
  args: { operatorId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    await requireCourseAccess(ctx, args.operatorId, args.courseId);
    return await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q: any) => q.eq("courseId", args.courseId))
      .first();
  },
});

export const getByProgram = query({
  args: { operatorId: v.string(), programId: v.string() },
  handler: async (ctx, args) => {
    await requireProgramAccess(ctx, args.operatorId, args.programId);
    return await ctx.db
      .query("courses")
      .withIndex("by_program", (q: any) => q.eq("programId", args.programId))
      .collect();
  },
});

export const getAll = query({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    await requireCampusAccess(ctx, args.operatorId, "Main Campus");
    return await ctx.db.query("courses").collect();
  },
});

export const search = query({
  args: {
    operatorId: v.string(),
    programId: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    keyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    } else {
      await requireCampusAccess(ctx, args.operatorId, "Main Campus");
    }
    let results = await ctx.db.query("courses").collect();
    if (args.programId) {
      results = results.filter((c: any) => c.programId === args.programId);
    }
    if (args.type) {
      results = results.filter((c: any) => c.type === args.type);
    }
    if (args.status) {
      results = results.filter((c: any) => c.status === args.status);
    }
    if (args.keyword) {
      const needle = args.keyword.toLowerCase();
      results = results.filter(
        (c: any) =>
          c.title.toLowerCase().includes(needle) ||
          c.description.toLowerCase().includes(needle) ||
          c.courseCode.toLowerCase().includes(needle) ||
          c.courseId.toLowerCase().includes(needle) ||
          c.learningOutcomes.some((o: string) => o.toLowerCase().includes(needle))
      );
    }
    return results;
  },
});

export const create = mutation({
  args: {
    operatorId: v.string(),
    programId: v.string(),
    courseCode: v.string(),
    title: v.string(),
    credits: v.number(),
    description: v.string(),
    type: v.string(),
    prerequisites: v.array(v.string()),
    semester: v.string(),
    enrollmentCap: v.number(),
    learningOutcomes: v.array(v.string()),
    instructorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireProgramAccess(ctx, args.operatorId, args.programId);
    const existing = await ctx.db.query("courses").collect();
    const nextNumber =
      existing
        .map((c: any) => Number(String(c.courseId).replace("CRS-", "")))
        .filter((value) => !Number.isNaN(value))
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    const courseId = `CRS-${String(nextNumber).padStart(3, "0")}`;
    await ctx.db.insert("courses", {
      courseId,
      programId: args.programId,
      courseCode: args.courseCode,
      title: args.title,
      credits: args.credits,
      description: args.description,
      type: args.type,
      status: "proposed",
      prerequisites: args.prerequisites,
      semester: args.semester,
      enrollmentCap: args.enrollmentCap,
      learningOutcomes: args.learningOutcomes,
      instructorName: args.instructorName,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "course.created",
      status: "success",
      programId: args.programId,
      entityId: courseId,
      summary: `Created course ${courseId} (${args.courseCode}) for program ${args.programId}.`,
      detailsJson: JSON.stringify({
        type: args.type,
        credits: args.credits,
      }),
    });
    return { courseId };
  },
});

export const updateStatus = mutation({
  args: {
    operatorId: v.string(),
    courseId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await requireCourseAccess(ctx, args.operatorId, args.courseId);
    const result = await ctx.db.patch(course._id, {
      status: args.status,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "course.status_updated",
      status: "success",
      programId: course.programId,
      entityId: course.courseId,
      summary: `Changed ${course.courseId} to ${args.status}.`,
    });
    return result;
  },
});
