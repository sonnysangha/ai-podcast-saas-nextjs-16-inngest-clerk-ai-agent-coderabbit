"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { estimateAssemblyAITime } from "@/lib/processing-time-estimator";
import type { Doc } from "@/convex/_generated/dataModel";

interface CompactProgressProps {
  jobStatus: Doc<"projects">["jobStatus"];
  fileDuration?: number;
  createdAt: number;
}

export function CompactProgress({
  jobStatus,
  fileDuration,
  createdAt,
}: CompactProgressProps) {
  const [progress, setProgress] = useState(0);

  const isTranscribing = jobStatus.transcription === "running";

  // Count completed content generation steps (all 6 outputs)
  const contentSteps = [
    jobStatus.keyMoments,
    jobStatus.summary,
    jobStatus.social,
    jobStatus.titles,
    jobStatus.hashtags,
    jobStatus.youtubeTimestamps,
  ];
  const completedSteps = contentSteps.filter((s) => s === "completed").length;
  const totalSteps = contentSteps.length;

  useEffect(() => {
    if (!isTranscribing) {
      // For content generation, show percentage based on completed steps
      const stepProgress = (completedSteps / totalSteps) * 100;
      setProgress(stepProgress);
      return;
    }

    // For transcription, update progress based on elapsed time
    const updateProgress = () => {
      const estimate = estimateAssemblyAITime(fileDuration);
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      const calculatedProgress = (elapsed / estimate.conservative) * 100;
      setProgress(Math.min(95, calculatedProgress));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [isTranscribing, createdAt, fileDuration, completedSteps, totalSteps]);

  const statusText = isTranscribing
    ? "🎙️ Transcribing..."
    : "✨ Generating content...";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs font-medium">
          {statusText}
        </Badge>
        <span className="text-xs font-semibold text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress
        value={progress}
        className="h-2 [&>div]:bg-green-500 [&>div]:animate-pulse"
      />
    </div>
  );
}
