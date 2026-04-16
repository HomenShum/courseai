import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByCourse = query({
  args: {
    courseId: v.string(),
    semester: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.semester) {
      return await ctx.db
        .query("enrollment")
        .withIndex("by_course_semester", (q: any) =>
          q.eq("courseId", args.courseId).eq("semester", args.semester!)
        )
        .collect();
    }
    return await ctx.db
      .query("enrollment")
      .withIndex("by_course", (q: any) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const getBySemester = query({
  args: { semester: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("enrollment")
      .withIndex("by_semester", (q: any) => q.eq("semester", args.semester))
      .collect();
  },
});

export const getLowEnrollment = query({
  args: { courseId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("enrollment").collect();
    if (args.courseId) {
      items = items.filter((e: any) => e.courseId === args.courseId);
    }
    return items.filter((e: any) => e.enrolled < e.capacity * 0.5);
  },
});
