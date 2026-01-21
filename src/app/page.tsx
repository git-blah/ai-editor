"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("Ask the question");

  async function submit() {
    let response = await fetch("/api/gemini", {
      method: "POST",
      body: JSON.stringify({ prompt: prompt }),
    });
  }

  return (
    <>
      <div className="h-screen grid grid-row-10">
        <UserButton />
        <div className="row-auto">{output}</div>
        <div className="row-end-10 flex items-center ">
          <textarea
            className="mx-4 min-h-10 w-5/6"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={1}
            placeholder="Type..."
          ></textarea>
          <Button className="m-2" onClick={submit}>
            Send
          </Button>
        </div>
      </div>
    </>
  );
}
