import { useMutation, useQuery } from "convex/react";

import { useAuth } from "@clerk/nextjs";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useProject = (projectId: Id<"projects">) => {
  return useQuery(api.projects.getById, { id: projectId });
};

export const useProjects = () => {
  return useQuery(api.projects.get);
};

export const useProjectsPartial = (limit: number) => {
  return useQuery(api.projects.getPartial, { limit });
};

export const useCreateProject = () => {
  const { userId } = useAuth();
  return useMutation(api.projects.create).withOptimisticUpdate((localStore, args) => {
    const existingProjects = localStore.getQuery(api.projects.get);
    if (existingProjects !== undefined) {
      const now = Date.now();
      const newProject = {
        _id: crypto.randomUUID() as Id<"projects">,
        _creationTime: now,
        name: args.name,
        ownerId: userId || "anonymous",
        updatedAt: now,
      };
      localStore.setQuery(api.projects.get, {}, [newProject, ...existingProjects]);
    }
  });
};

export const useRenameProject = () => {
  return useMutation(api.projects.rename).withOptimisticUpdate((localstore, args) => {
    const existingProject = localstore.getQuery(api.projects.getById, { id: args.id });
    const now = Date.now();
    if (existingProject !== undefined && existingProject !== null) {
      localstore.setQuery(
        api.projects.getById,
        { id: args.id },
        {
          ...existingProject,
          name: args.name,
          updatedAt: now,
        },
      );
    }

    const existingProjects = localstore.getQuery(api.projects.get);

    if (existingProjects !== undefined) {
      localstore.setQuery(
        api.projects.get,
        {},
        existingProjects.map((project) => {
          return project._id === args.id
            ? { ...project, name: args.name, updatedAt: now }
            : project;
        }),
      );
    }
  });
};
