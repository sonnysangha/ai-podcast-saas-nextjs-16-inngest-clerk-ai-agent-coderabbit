"use client";

import { FileAudio, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProjectAction } from "@/app/actions/projects";
import { CompactProgress } from "@/components/projects/compact-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDuration, formatFileSize, formatSmartDate } from "@/lib/format";
import { getStatusIcon, getStatusVariant } from "@/lib/status-utils";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Doc<"projects">;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const StatusIcon = getStatusIcon(project.status);

  // Get processing phase for status badge
  const getProcessingPhase = () => {
    if (project.status !== "processing") return project.status;

    if (project.jobStatus?.transcription === "running") {
      return "Transcribing";
    }

    // Just say "Generating" without the count
    return "Generating";
  };

  const handleDelete = async (e: React.MouseEvent) => {
    // Prevent navigation to detail page
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteProjectAction(project._id);
      toast.success("Project deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/dashboard/projects/${project._id}`} className="block">
      <div
        className={cn(
          "glass-card rounded-2xl group relative hover-lift cursor-pointer overflow-hidden transition-all",
          project.status === "processing" &&
            "ring-2 ring-emerald-400 shadow-emerald-200 shadow-lg",
          project.status === "failed" && "ring-2 ring-red-400",
        )}
      >
        <div className="p-6 md:p-7">
          <div className="flex items-start gap-5">
            {/* File Icon - larger, animated */}
            <div className="rounded-2xl gradient-emerald p-4 md:p-5 shrink-0 group-hover:scale-110 transition-transform shadow-lg">
              <FileAudio className="h-10 w-10 md:h-12 md:w-12 text-white" />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0 overflow-hidden space-y-3">
              {/* Title + Status + Delete */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-extrabold text-lg md:text-xl lg:text-2xl wrap-break-word hyphens-auto group-hover:text-emerald-600 transition-colors leading-snug">
                    {project.displayName || project.fileName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    {formatSmartDate(project.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {project.status !== "completed" && (
                    <Badge
                      variant={getStatusVariant(project.status)}
                      className={cn(
                        "flex items-center gap-2 h-9 md:h-10 text-sm md:text-base px-4 whitespace-nowrap font-bold shadow-md",
                        project.status === "processing" &&
                          "gradient-emerald text-white animate-pulse-emerald",
                      )}
                    >
                      <StatusIcon
                        className={`h-4 w-4 md:h-5 md:w-5 ${project.status === "processing" ? "animate-spin" : ""}`}
                      />
                      <span className="hidden md:inline">
                        {getProcessingPhase()}
                      </span>
                      <span className="md:hidden">
                        {project.status === "processing"
                          ? project.jobStatus?.transcription === "running"
                            ? "Trans"
                            : "Gen"
                          : project.status}
                      </span>
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-10 w-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-red-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Metadata with badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
                  {formatFileSize(project.fileSize)}
                </Badge>
                <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200 uppercase">
                  {project.fileFormat}
                </Badge>
                {project.fileDuration && (
                  <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
                    {formatDuration(project.fileDuration)}
                  </Badge>
                )}
              </div>

              {/* Progress Indicator for Processing */}
              {project.status === "processing" && project.jobStatus && (
                <div className="pt-2">
                  <CompactProgress
                    jobStatus={project.jobStatus}
                    fileDuration={project.fileDuration}
                    createdAt={project.createdAt}
                  />
                </div>
              )}

              {/* Error Message */}
              {project.status === "failed" && project.error && (
                <div className="mt-2 p-4 rounded-xl bg-red-50 border-2 border-red-200">
                  <p className="text-sm text-red-700 font-semibold">
                    {project.error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
