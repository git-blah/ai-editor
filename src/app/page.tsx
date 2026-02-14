import { ProjectView } from "@/features/projects/components/project-view";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-2 bg-sidebar flex justify-end">
        <UserButton />
      </div>
      <div className="flex flex-1">
        <ProjectView />
      </div>
    </div>
  );
}
