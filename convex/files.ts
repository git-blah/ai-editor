import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { verifyAuth } from "./auth";

export const getFiles = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access");
    }

    return await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id);

    if (!file) {
      throw new Error("file not found");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access");
    }

    return file;
  },
});

export const getFolderContent = query({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    //sort : folder first, files, alphabetically
    return files.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      return a.name.localeCompare(b.name);
    });
  },
});

export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    parentId: v.optional(v.id("files")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to project");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existing = files.find((file) => file.name === args.name && file.type === "file");

    if (existing) throw new Error("File already exists");

    const now = Date.now();
    await ctx.db.insert("files", {
      projectId: args.projectId,
      name: args.name,
      content: args.content,
      parentId: args.parentId,
      updatedAt: now,
      type: "file",
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: now,
    });
  },
});

export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    parentId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to project");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existing = files.find((file) => file.name === args.name && file.type === "folder");

    if (existing) throw new Error("Folder already exists");

    const now = Date.now();

    await ctx.db.insert("files", {
      projectId: args.projectId,
      name: args.name,
      parentId: args.parentId,
      updatedAt: now,
      type: "folder",
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: now,
    });
  },
});

export const renameFile = mutation({
  args: {
    id: v.id("files"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    //file check
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("File not found");

    //Check if project exist or not
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("Project not found");

    //owner permission check - authorization
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    //file with new name already exit in foler or not - check siblings in parent folder
    const siblings = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", file.projectId).eq("parentId", file.parentId),
      )
      .collect();

    const existing = siblings.find(
      (sibling) =>
        sibling.name === args.newName && sibling.type === file.type && sibling._id !== args.id, //siblng id last chek important and missed. as sibligns will result in same file too when checking but it has to be ignord using id.
    );

    if (existing) {
      throw new Error(`A ${file.type} with this name already exist in this location`);
    }

    const now = Date.now();
    //udpate file name
    await ctx.db.patch("files", args.id, {
      name: args.newName,
      updatedAt: now,
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: now,
    });
  },
});

export const deleteFile = mutation({
  args: {
    id: v.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    //file check
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("File not found");

    //Check if project exist or not
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("Project not found");

    //owner permission check - authorization
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    //recursively delete file and folder with all it decendant
    const deleteRecursive = async (fileId: Id<"files">) => {
      const item = await ctx.db.get("files", fileId);
      if (!item) return;

      //If its a folder, delete all children first
      if (item.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_project_parent", (q) =>
            q.eq("projectId", item.projectId).eq("parentId", fileId),
          )
          .collect();

        for (const child of children) {
          await deleteRecursive(child._id);
        }
      }

      //Delete storage files if it exits
      if (item.storageId) {
        await ctx.storage.delete(item.storageId);
      }

      //Delete file/folder iteself at end
      await ctx.db.delete("files", fileId);
    };

    await deleteRecursive(args.id);

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });
  },
});

//modifying the content of the file
export const updateFile = mutation({
  args: {
    id: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    //file check
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("File not found");

    //Check if project exist or not
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("Project not found");

    //owner permission check - authorization
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    const now = Date.now();

    await ctx.db.patch("files", args.id, {
      content: args.content,
      updatedAt: now,
    });

    //upadating the projectTable for ui in editor
    await ctx.db.patch("projects", file.projectId, {
      updatedAt: now,
    });
  },
});

export const getFilePath = query({
  args: {
    id: v.id("files"),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.id);

    if (!file) {
      throw new Error("File not found");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access");
    }

    const path: { _id: string; name: string }[] = [];

    let currentId: Id<"files"> | undefined = args.id;

    while (currentId) {
      const file : Doc<"files"> | null = await ctx.db.get("files", currentId)

      if (!file) break;

      path.unshift({ _id: file._id, name: file.name });
      currentId = file.parentId;
    }

    return path;
  },
});
