import { inngest } from "./client";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const helloWorld = inngest.createFunction(
  { id: "demo" },
  { event: "demo/generate" },
  async ({ event, step }) => {
    return await generateText({
      model: google("gemini-3-flash-preview"),
      prompt: event.data.prompt,
    });
  },
);
