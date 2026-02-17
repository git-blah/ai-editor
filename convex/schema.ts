import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
    importStatus: v.optional(
      v.union(v.literal("importing"), v.literal("completed"), v.literal("failed")),
    ),
    exportStatus: v.optional(
      v.union(v.literal("importing"), v.literal("completed"), v.literal("failed")),
    ),
    exportRepoUrl: v.optional(v.string()),
  }).index("by_owner", ["ownerId"]),

  files: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    parentId: v.optional(v.id("files")),
    content: v.optional(v.string()), // text files only no other format.
    storageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),
});
