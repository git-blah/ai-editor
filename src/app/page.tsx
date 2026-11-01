import { ProjectView } from "@/features/projects/components/project-view";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-0 via-black to-blue-950">
      <div className="p-2 flex justify-end bg-transparent">
        <UserButton />
      </div>
      <div className="flex flex-1 bg-transparent">
        <ProjectView />
      </div>
    </div>
  );
}
