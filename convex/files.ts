import { v } from "convex/values";

import { requireOperator, requireCampusAccess, requireProgramAccess } from "./access";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

function inferFileCategory(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("json")
  ) {
    return "document";
  }
  return "other";
}

async function nextFileId(ctx: any) {
  const existing = await ctx.db.query("files").collect();
  const nextNumber =
    existing
      .map((file: any) => Number(String(file.fileId).replace("FILE-", "")))
      .filter((value: number) => !Number.isNaN(value))
      .reduce((max: number, value: number) => Math.max(max, value), 0) + 1;
  return `FILE-${String(nextNumber).padStart(3, "0")}`;
}

async function hydrateFilesWithUrls(ctx: any, files: any[]) {
  return await Promise.all(
    files.map(async (file) => ({
      ...file,
      url: file.storageId ? await ctx.storage.getUrl(file.storageId) : null,
    }))
  );
}

export const generateUploadUrl = mutation({
  args: { operatorId: v.string() },
  handler: async (ctx, args) => {
    await requireOperator(ctx, args.operatorId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    operatorId: v.string(),
    courseId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.string(),
    analysisStatus: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    }
    if (args.campusId) {
      await requireCampusAccess(ctx, args.operatorId, args.campusId);
    }
    const fileId = await nextFileId(ctx);
    await ctx.db.insert("files", {
      fileId,
      courseId: args.courseId,
      sessionId: args.sessionId,
      programId: args.programId,
      campusId: args.campusId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileCategory: inferFileCategory(args.mimeType),
      sizeBytes: args.sizeBytes,
      storageId: args.storageId,
      uploadedBy: args.uploadedBy,
      uploadedAt: new Date().toISOString(),
      analysisStatus: args.analysisStatus ?? "uploaded",
      summary: args.summary,
    });
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "file.uploaded",
      status: "success",
      programId: args.programId,
      campusId: args.campusId,
      entityId: fileId,
      summary: `Uploaded ${args.filename}.`,
      detailsJson: JSON.stringify({
        mimeType: args.mimeType,
        sizeBytes: args.sizeBytes,
      }),
    });
    return {
      fileId,
      filename: args.filename,
      mimeType: args.mimeType,
      fileCategory: inferFileCategory(args.mimeType),
      sizeBytes: args.sizeBytes,
    };
  },
});

export const getByCourse = query({
  args: { operatorId: v.string(), courseId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const getBySession = query({
  args: {
    operatorId: v.string(),
    sessionId: v.string(),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    }
    if (args.campusId) {
      await requireCampusAccess(ctx, args.operatorId, args.campusId);
    }
    const files = await ctx.db
      .query("files")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const getByIds = query({
  args: {
    operatorId: v.string(),
    fileIds: v.array(v.string()),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    }
    if (args.campusId) {
      await requireCampusAccess(ctx, args.operatorId, args.campusId);
    }
    if (args.fileIds.length === 0) {
      return [];
    }
    const wanted = new Set(args.fileIds);
    const files = (await ctx.db.query("files").collect()).filter((file: any) =>
      wanted.has(file.fileId)
    );
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const listByCourseIds = query({
  args: {
    operatorId: v.string(),
    courseIds: v.array(v.string()),
    programId: v.optional(v.string()),
    campusId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.programId) {
      await requireProgramAccess(ctx, args.operatorId, args.programId);
    }
    if (args.campusId) {
      await requireCampusAccess(ctx, args.operatorId, args.campusId);
    }
    if (args.courseIds.length === 0) {
      return [];
    }
    const wanted = new Set(args.courseIds);
    const files = (await ctx.db.query("files").collect()).filter(
      (file: any) => file.courseId && wanted.has(file.courseId)
    );
    return await hydrateFilesWithUrls(ctx, files);
  },
});

export const remove = mutation({
  args: { operatorId: v.string(), fileId: v.string() },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();
    if (!file) {
      throw new Error(`File ${args.fileId} not found.`);
    }
    if (file.programId) {
      await requireProgramAccess(ctx, args.operatorId, file.programId);
    }
    if (file.campusId) {
      await requireCampusAccess(ctx, args.operatorId, file.campusId);
    }
    if (file.storageId) {
      await ctx.storage.delete(file.storageId as Id<"_storage">);
    }
    await ctx.db.delete(file._id);
    await ctx.runMutation(internal.audit.record, {
      actorId: args.operatorId,
      eventType: "file.removed",
      status: "success",
      programId: file.programId,
      campusId: file.campusId,
      entityId: file.fileId,
      summary: `Removed ${file.filename}.`,
    });
    return { fileId: args.fileId };
  },
});
