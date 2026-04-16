import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOperator } from "./access";

function rankReview(review: any, needle: string) {
  const haystack = `${review.findings} ${review.recommendations} ${review.type}`.toLowerCase();
  let score = 0;
  if (haystack.includes(needle)) score += 4;
  if (review.type.toLowerCase().includes(needle)) score += 2;
  if (review.courseId.toLowerCase().includes(needle)) score += 3;
  return score;
}

export const search = query({
  args: {
    operatorId: v.optional(v.string()),
    courseId: v.optional(v.string()),
    type: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.operatorId) await requireOperator(ctx, args.operatorId);
    let rows = await ctx.db.query("reviews").collect();
    if (args.courseId) {
      rows = rows.filter((row: any) => row.courseId === args.courseId);
    }
    if (args.type) {
      rows = rows.filter((row: any) => row.type === args.type);
    }
    if (args.query) {
      const needle = args.query.toLowerCase();
      rows = rows
        .map((row: any) => ({ row, score: rankReview(row, needle) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.row);
    }
    return rows.slice(0, args.limit ?? 10);
  },
});

export const getByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_course", (q: any) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const create = mutation({
  args: {
    reviewId: v.string(),
    courseId: v.string(),
    type: v.string(),
    findings: v.string(),
    recommendations: v.string(),
    semester: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reviews", args);
  },
});
