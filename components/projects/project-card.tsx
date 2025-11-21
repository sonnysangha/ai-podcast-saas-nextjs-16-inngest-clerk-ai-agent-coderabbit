"use client";

import { ChevronRight, FileAudio, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProjectAction } from "@/app/actions/projects";
import { CompactProgress } from "@/components/projects/compact-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card
        className={cn(
          "group relative hover:shadow-lg transition-all cursor-pointer overflow-hidden hover:scale-[1.005]",
          project.status === "processing" &&
            "border-l-4 border-l-green-500 bg-green-50/30",
          project.status === "failed" && "border-l-4 border-l-destructive",
        )}
      >
        <CardContent className="p-4 @md:p-5">
          <div className="flex items-start gap-3 @md:gap-4">
            {/* File Icon - larger, animated */}
            <div className="rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 p-3 @md:p-4 shrink-0 group-hover:scale-105 transition-transform">
              <FileAudio className="h-8 w-8 @md:h-10 @md:w-10 text-primary" />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0 overflow-hidden space-y-2">
              {/* Title + Status + Delete */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-bold text-base @lg:text-lg @xl:text-xl wrap-break-word hyphens-auto group-hover:text-primary transition-colors leading-snug">
                    {project.displayName || project.fileName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatSmartDate(project.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {project.status === "completed" ? (
                    <div className="rounded-full bg-muted/50 p-1.5 group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ) : (
                    <Badge
                      variant={getStatusVariant(project.status)}
                      className="flex items-center gap-1.5 h-7 @md:h-8 text-xs @md:text-sm px-2.5 @md:px-3 whitespace-nowrap"
                    >
                      <StatusIcon
                        className={`h-3.5 w-3.5 @md:h-4 @md:w-4 ${project.status === "processing" ? "animate-spin" : ""}`}
                      />
                      <span className="hidden @md:inline">
                        {getProcessingPhase()}
                      </span>
                      <span className="@md:hidden">
                        {project.status === "processing"
                          ? project.jobStatus?.transcription === "running"
                            ? "Trans"
                            : "Gen"
                          : project.status}
                      </span>
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 @md:h-8 @md:w-8 p-0 hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Metadata with badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {formatFileSize(project.fileSize)}
                </Badge>
                <Badge variant="outline" className="text-xs uppercase">
                  {project.fileFormat}
                </Badge>
                {project.fileDuration && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(project.fileDuration)}
                  </Badge>
                )}
              </div>

              {/* Progress Indicator for Processing */}
              {project.status === "processing" && project.jobStatus && (
                <CompactProgress
                  jobStatus={project.jobStatus}
                  fileDuration={project.fileDuration}
                  createdAt={project.createdAt}
                />
              )}

              {/* Error Message */}
              {project.status === "failed" && project.error && (
                <div className="mt-1">
                  <p className="text-sm text-destructive font-medium">
                    {project.error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
