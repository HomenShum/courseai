import { v } from "convex/values";

import { requireOperator, requireCampusAccess, requireProgramAccess } from "./access";
import { internalMutation, mutation, query } from "./_generated/server";

async function nextEventId(ctx: any) {
  const rows = await ctx.db.query("eventLogs").collect();
  const nextNumber =
    rows
      .map((row: any) => Number(String(row.eventId).replace("EVT-", "")))
      .filter((value: number) => !Number.isNaN(value))
      .reduce((max: number, value: number) => Math.max(max, value), 0) + 1;
  return `EVT-${String(nextNumber).padStart(4, "0")}`;
}

export const record = internalMutation({
  args: {
    actorId: v.string(),
    eventType: v.string(),
    status: v.string(),
    summary: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    detailsJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const operator = await requireOperator(ctx, args.actorId);
    const eventId = await nextEventId(ctx);
    await ctx.db.insert("eventLogs", {
      eventId,
      eventType: args.eventType,
      status: args.status,
      actorId: operator.operatorId,
      actorName: operator.name,
      actorRole: operator.role,
      programId: args.programId,
      campusId: args.campusId,
      entityId: args.entityId,
      summary: args.summary,
      detailsJson: args.detailsJson,
      createdAt: new Date().toISOString(),
    });
    return { eventId };
  },
});

export const listRecent = query({
  args: {
    operatorId: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    }
    if (args.campusId) {
      await requireCampusAccess(ctx, args.operatorId, args.campusId);
    }
    const rows = await ctx.db.query("eventLogs").collect();
    return rows
      .filter((row: any) => {
        if (args.programId) return row.programId === args.programId;
        if (args.campusId) return row.campusId === args.campusId;
        return row.actorId === args.operatorId;
      })
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, args.limit ?? 12);
  },
});
