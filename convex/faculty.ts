import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireProgramAccess } from "./access";

export const getByProgram = query({
  args: { operatorId: v.string(), programId: v.string() },
  handler: async (ctx, args) => {
    await requireProgramAccess(ctx, args.operatorId, args.programId);
    return await ctx.db
      .query("faculty")
      .withIndex("by_program", (q: any) => q.eq("programId", args.programId))
      .collect();
  },
});

export const getAll = query({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("faculty").collect();
  },
});

export const getById = query({
  args: { facultyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("faculty")
      .withIndex("by_facultyId", (q: any) => q.eq("facultyId", args.facultyId))
      .first();
  },
});

export const getOverloaded = query({
  args: { programId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let rows = await ctx.db.query("faculty").collect();
    if (args.programId) {
      rows = rows.filter((f: any) => f.programId === args.programId);
    }
    return rows.filter((f: any) => f.courseLoad >= f.maxLoad);
  },
});
