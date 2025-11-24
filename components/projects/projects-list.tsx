"use client";

import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { EmptyState } from "@/components/projects/empty-state";
import { PageHeader } from "@/components/projects/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import type { api } from "@/convex/_generated/api";

interface ProjectsListProps {
  preloadedProjects: Preloaded<typeof api.projects.listUserProjects>;
}

export function ProjectsList({ preloadedProjects }: ProjectsListProps) {
  // Use preloaded data and subscribe to real-time updates
  const projectsResult = usePreloadedQuery(preloadedProjects);
  const projects = projectsResult.page || [];
  const hasProjects = projects.length > 0;

  return (
    <div className="container max-w-6xl mx-auto py-10 px-12 xl:px-0">
      <PageHeader />

      {!hasProjects && <EmptyState />}

      {hasProjects && (
        <div className="grid gap-4 @container">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
