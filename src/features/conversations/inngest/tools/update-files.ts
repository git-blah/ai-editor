import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface UpdateFilesToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z.string().min(1, "File ID cannot be empty"),
  content: z.string(),
});

export const createUpdateFilesTool = ({ internalKey }: UpdateFilesToolOptions) => {
  return createTool({
    name: "updateFiles",
    description: "Update the content of an existing file",
    parameters: z.object({
      fileId: z.string().describe("Id of the file to update"),
      content: z.string().describe("The new content of the file"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error : ${parsed.error.issues[0].message}`;
      }

      const { fileId, content } = parsed.data;

      //validate file exist before running step
      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error : File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
      }
      if (file.type === "folder") {
        return `Error : "${fileId} is a folder, not a file. You can only update file contents.`;
      }

      try {
        return await toolStep?.run("update-files", async () => {
          await convex.mutation(api.system.updateFile, {
            internalKey,
            fileId: fileId as Id<"files">,
            content,
          });

          return `File "${file.name}" updated successfully`;
        });
      } catch (error) {
        return `Error updating file: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
