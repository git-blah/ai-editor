"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function Home() {
  const projects = useQuery(api.projects.get);
  const addnew = useMutation(api.projects.create);

  return (
    <>
      <Button onClick={() => addnew({ name: "New project" })}> Add New</Button>
      <main className="flex flex-col justify-between p-4 gap-2">
        {projects?.map(({ _id, name, ownerId }) => (
          <div key={_id} className=" p-2 border-2 rounded-xl w-fit">
            {name} : {ownerId}
          </div>
        ))}
      </main>
    </>
  );
}
