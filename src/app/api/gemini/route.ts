import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client"; // Import our client

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

// Create a simple async Next.js API route handler
export async function POST(req: Request) {
  // Send your event payload to Inngest
  let data = await req.json();

  let response = await inngest.send({
    name: "demo/generate",
    data: {
      prompt: data.prompt,
    },
  });

  return NextResponse.json({ message: response });
}
