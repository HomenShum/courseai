import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireCourseAccess, requireCampusAccess, requireProgramAccess } from "./access";

export const list = query({
  args: {
    operatorId: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    courseId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    }
    if (args.campusId) {
      await requireCampusAccess(ctx, args.operatorId, args.campusId);
    }
    let rows = await ctx.db.query("actionItems").collect();
    if (args.programId) {
      rows = rows.filter((row: any) => row.programId === args.programId);
    }
    if (args.campusId) {
      rows = rows.filter((row: any) => row.campusId === args.campusId);
    }
    if (args.courseId) {
      rows = rows.filter((row: any) => row.courseId === args.courseId);
    }
    if (args.status) {
      rows = rows.filter((row: any) => row.status === args.status);
    }
    return rows.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  },
});

export const create = mutation({
  args: {
    operatorId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const { operatorId, ...recordArgs } = args;
    if (args.courseId) {
      await requireCourseAccess(ctx, operatorId, args.courseId);
    } else if (args.programId) {
      await requireProgramAccess(ctx, operatorId, args.programId);
    } else if (args.campusId) {
      await requireCampusAccess(ctx, operatorId, args.campusId);
    }
    const existing = await ctx.db.query("actionItems").collect();
    const nextNumber =
      existing
        .map((item: any) => Number(String(item.actionItemId).replace("ACT-", "")))
        .filter((value) => !Number.isNaN(value))
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    const inserted = await ctx.db.insert("actionItems", {
      ...recordArgs,
      actionItemId: `ACT-${String(nextNumber).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      completedAt: undefined,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: operatorId,
      eventType: "action_item.created",
      status: "success",
      programId: args.programId,
      campusId: args.campusId,
      entityId: `ACT-${String(nextNumber).padStart(3, "0")}`,
      summary: `Created action item ${args.title}.`,
    });
    return inserted;
  },
});

export const updateStatus = mutation({
  args: {
    operatorId: v.string(),
    actionItemId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("actionItems")
      .collect()
      .then((rows: any[]) =>
        rows.find((row) => row.actionItemId === args.actionItemId)
      );
    if (!existing) {
      throw new Error(`Action item ${args.actionItemId} not found.`);
    }
    if (existing.programId) {
      await requireProgramAccess(ctx, args.operatorId, existing.programId);
    } else if (existing.campusId) {
      await requireCampusAccess(ctx, args.operatorId, existing.campusId);
    }
    const result = await ctx.db.patch(existing._id, {
      status: args.status,
      completedAt: args.status === "completed" ? new Date().toISOString() : undefined,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "action_item.status_updated",
      status: "success",
      programId: existing.programId,
      campusId: existing.campusId,
      entityId: existing.actionItemId,
      summary: `Changed ${existing.actionItemId} to ${args.status}.`,
    });
    return result;
  },
});
