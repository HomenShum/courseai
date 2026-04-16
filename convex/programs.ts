import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireCampusAccess, requireProgramAccess } from "./access";

export const getAll = query({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    await requireCampusAccess(ctx, args.operatorId, "Main Campus");
    return await ctx.db.query("programs").collect();
  },
});

export const getByCampus = query({
  args: { operatorId: v.string(), campusId: v.string() },
  handler: async (ctx, args) => {
    await requireCampusAccess(ctx, args.operatorId, args.campusId);
    return await ctx.db
      .query("programs")
      .withIndex("by_campus", (q: any) => q.eq("campus", args.campusId))
      .collect();
  },
});

export const getById = query({
  args: { operatorId: v.string(), programId: v.string() },
  handler: async (ctx, args) => {
    await requireProgramAccess(ctx, args.operatorId, args.programId);
    return await ctx.db
      .query("programs")
      .withIndex("by_programId", (q: any) => q.eq("programId", args.programId))
      .first();
  },
});
