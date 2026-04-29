import { NonRetriableError } from "inngest";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { createAgent, anthropic, createNetwork } from "@inngest/agent-kit";

import { CODING_AGENT_SYSTEM_PROMPT, TITLE_GENERATOR_SYSTEM_PROMPT } from "./constant";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { createReadFilesTool } from "./tools/read-files";
import { createListFilesTool } from "./tools/list-files";
import { createUpdateFilesTool } from "./tools/update-files";
import { createCreateFilesTool } from "./tools/create-files";
import { createCreateFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { createDeleteFilesTool } from "./tools/delete-files";
import { createScrapeUrlsTool } from "./tools/scrape-urls";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
}

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      // inngest feature ... to cancel
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.CONVEX_INTERNAL_KEY;

      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "Encountered an error while processing request. Let me know if you need anything else!",
          });
        });
      }
    },
  },
  {
    event: "message/sent",
  },
  async ({ event, step }) => {
    const { messageId, conversationId, projectId, message } = event.data as MessageEvent;

    const internalKey = process.env.CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("CONVEX_INTERNAL_KEY is not configured");
    }

    // TODO: check if this is needed (data sync. inngest agent running faster than convex db update )
    await step.sleep("wait-for-db-sync", "1s");

    // Get conversation for title genereation check
    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    //fetch recent messages for conversation context
    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 10,
      });
    });

    //build system prompt with conversation histor(exclude the current processing messages)
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    //Filter out current processing messages
    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content !== "",
    );
    //structuring
    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation(for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    const shouldGenerateTitle = conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      const titleAgent = createAgent({
        name: "title-generator",
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: anthropic({
          model: "claude-opus-4-20250514",
          defaultParameters: { temperature: 0, max_tokens: 50 },
        }),
      });

      const { output } = await titleAgent.run(message, { step });

      //assitant cna return tools and otehr things.
      const textMessage = output.find((m) => m.type === "text" && m.role === "assistant");

      if (textMessage?.type === "text") {
        const title =
          typeof textMessage.content === "string"
            ? textMessage.content.trim()
            : textMessage.content
                .map((c) => c.text)
                .join("")
                .trim();

        if (title) {
          await step.run("update-conversation-title", async () => {
            await convex.mutation(api.system.updateConversationTitle, {
              internalKey,
              conversationId,
              title,
            });
          });
        }
      }
    }
    //Create agent with tools
    const codingAgent = createAgent({
      name: "polaris",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: anthropic({
        model: "claude-opus-4-20250514",
        defaultParameters: { temperature: 0.3, max_tokens: 16000 },
      }),
      tools: [
        createListFilesTool({ projectId, internalKey }),
        createReadFilesTool({ internalKey }),
        createUpdateFilesTool({ internalKey }),
        createCreateFilesTool({ projectId, internalKey }),
        createCreateFolderTool({ projectId, internalKey }),
        createRenameFileTool({ internalKey }),
        createDeleteFilesTool({ internalKey }),
        createScrapeUrlsTool(),
      ],
    });

    //Create network with single agent
    const network = createNetwork({
      name: "polaris-network",
      agents: [codingAgent],
      maxIter: 20, //find by working, budget etc..
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(
          (m) => m.type === "text" && m.role === "assistant",
        );
        const hasToolCalls = lastResult?.output.some((m) => m.type === "tool_call");

        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }

        return codingAgent;
      },
    });

    //run the agent
    const result = await network.run(message);

    //Extract assistant's text response from the last agent result
    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find((m) => m.type === "text" && m.role === "assistant");

    let assistantResponse = "I processed your request. Let me know if you need anything else";

    if (textMessage?.type === "text") {
      assistantResponse =
        typeof textMessage.content === "string"
          ? textMessage.content
          : textMessage.content.map((c) => c.text).join("");
    }

    //update assistant message with the response - this also set status to completed.
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
      });
    });

    return { success: true, messageId, conversationId };
  },
);
