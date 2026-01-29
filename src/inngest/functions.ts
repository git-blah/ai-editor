import { firecrawl } from "@/lib/firecrawl";
import { inngest } from "./client";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const URL_REGEX = /https?:\/\/[^\s]+/g;

export const helloWorld = inngest.createFunction(
  { id: "demo" },
  { event: "demo/generate" },
  async ({ event, step }) => {
    const { prompt } = event.data as { prompt: string };

    const urls = (await step.run("extract-urls", async () => {
      return prompt.match(URL_REGEX) ?? [];
    })) as string[];

    const scrapedContent = await step.run("scrape-urls", async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await firecrawl.scrape(url, { formats: ["markdown"] });
          return result.markdown ?? null;
        }),
      );
      return results.filter(Boolean).join("\n\n");
    });

    const finalPrompt = scrapedContent
      ? `Context:\n${scrapedContent}\n\nQuestion:${prompt}`
      : prompt;

    return await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: finalPrompt,
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });
  },
);
