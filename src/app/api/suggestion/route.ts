import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import z from "zod";
import { auth } from "@clerk/nextjs/server";

const suggestionSchema = z.object({
  suggestion: z
    .string()
    .describe("The code to insert at cursor, or empty string if no completion needed"),
});

const SUGGESTION_PROMPT = `**Role**: You are an expert Code Completion Assistant. Your goal is to provide seamless, context-aware code suggestions.

**Context**:
- **File**: {fileName}
- **Surrounding Code**: {code}
- **Current Line (No. {lineNumber})**: {currentLine}
- **Cursor Position**: 
  - before_cursor: {textBeforeCursor}
  - after_cursor: {textAfterCursor}
  - next_lines : {nextLines}

**Logic Flow (Strict Priority)**:
1. **Redundancy Check**: Analyze the next_lines. If the code immediately following the cursor already completes the logical thought or statement, return an empty string. Do not repeat existing code.
2. **Completion Check**: If before_cursor ends with a complete statement (e.g., ;, }, or )), assume the user is starting a new thought and return an empty string.
3. **In-fill Generation**: If neither of the above apply, generate the code that should be typed at the cursor. 

**Constraints**:
- Output **ONLY** the code to be inserted.
- Do not include markdown code blocks ().
- Do not include explanations.
- Ensure the suggestion blends perfectly with the existing textBeforeCursor and textAfterCursor.`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    const {
      fileName,
      code,
      currentLine,
      previousLines,
      textBeforeCursor,
      textAfterCursor,
      nextLines,
      lineNumber,
    } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 404 });
    }

    const prompt = SUGGESTION_PROMPT.replace("{fileName}", fileName)
      .replace("{code}", code)
      .replace("{currentLine}", currentLine)
      .replace("{previousLines}", previousLines || "")
      .replace("{textBeforeCursor}", textBeforeCursor)
      .replace("{textAfterCursor}", textAfterCursor)
      .replace("{nextLines}", nextLines || "")
      .replace("{lineNumber}", lineNumber.toString());

    // const { output } = await generateText({
    //   model: anthropic("claude-opus-4-0"),
    //   output: Output.object({ schema: suggestionSchema }),
    //   prompt,
    // });

    const { output } = { output: { suggestion: "it works" } };

    return NextResponse.json({ suggestion: output.suggestion });
  } catch (error) {
    console.error("Suggestion error", error);
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 });
  }
}
