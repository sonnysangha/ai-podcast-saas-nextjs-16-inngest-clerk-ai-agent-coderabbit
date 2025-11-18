"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  ChevronDown,
  FileText,
  Sparkles,
  MessageSquare,
  Share2,
  Type,
  Hash,
  Clock,
  Youtube,
} from "lucide-react";
import {
  estimateAssemblyAITime,
  formatTimeRange,
} from "@/lib/processing-time-estimator";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface ProcessingFlowProps {
  jobStatus: Doc<"projects">["jobStatus"];
  fileDuration?: number;
  createdAt: number;
  stepUpdates?: Map<string, { message: string; status: string }>;
}

export function ProcessingFlow({
  jobStatus,
  fileDuration,
  createdAt,
  stepUpdates,
}: ProcessingFlowProps) {
  const transcriptionStatus = jobStatus.transcription;
  const isTranscribing = transcriptionStatus === "running";
  const transcriptionComplete = transcriptionStatus === "completed";
  const transcriptionFailed = transcriptionStatus === "failed";

  // Get real time estimates based on audio duration
  const timeEstimate = estimateAssemblyAITime(fileDuration);
  const timeRangeText = formatTimeRange(
    timeEstimate.bestCase,
    timeEstimate.conservative,
  );

  // Track progress based on elapsed time vs conservative estimate
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  useEffect(() => {
    if (!isTranscribing) {
      setTranscriptionProgress(0);
      return;
    }

    // Calculate progress based on actual elapsed time since job started
    const updateProgress = () => {
      const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);
      const progress = (elapsedSeconds / timeEstimate.conservative) * 100;
      // Cap at 95% so it doesn't sit at 100% waiting
      setTranscriptionProgress(Math.min(95, progress));
    };

    // Set initial progress immediately
    updateProgress();

    // Update every second
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [isTranscribing, createdAt, timeEstimate.conservative]);

  const parallelSteps = [
    {
      key: "keyMoments",
      label: "Key Moments",
      status: jobStatus.keyMoments,
      icon: Sparkles,
    },
    {
      key: "summary",
      label: "Summary",
      status: jobStatus.summary,
      icon: MessageSquare,
    },
    {
      key: "social",
      label: "Social Posts",
      status: jobStatus.social || "pending",
      icon: Share2,
    },
    { key: "titles", label: "Titles", status: jobStatus.titles, icon: Type },
    {
      key: "hashtags",
      label: "Hashtags",
      status: jobStatus.hashtags,
      icon: Hash,
    },
    {
      key: "youtubeTimestamps",
      label: "YouTube Timestamps",
      status: jobStatus.youtubeTimestamps,
      icon: Youtube,
    },
  ];

  return (
    <div className="space-y-8">
      {/* HERO: Transcription Section */}
      <Card
        className={cn(
          "border-2 transition-all",
          isTranscribing && "border-green-500 shadow-lg",
          transcriptionComplete && "border-gray-300",
          transcriptionFailed && "border-destructive",
        )}
      >
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Transcription</h3>
                  <p className="text-muted-foreground">
                    {isTranscribing && "AI is transcribing your audio..."}
                    {transcriptionComplete && "Transcription complete!"}
                    {transcriptionFailed && "Transcription failed"}
                    {transcriptionStatus === "pending" &&
                      "Preparing to transcribe..."}
                  </p>
                </div>
              </div>

              {/* Status Icon */}
              <div>
                {isTranscribing && (
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                )}
                {transcriptionComplete && (
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                )}
                {transcriptionFailed && (
                  <XCircle className="h-10 w-10 text-destructive" />
                )}
              </div>
            </div>

            {/* Processing message (when running) */}
            {isTranscribing && (
              <div className="space-y-3">
                <Progress value={transcriptionProgress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Estimated time: {timeRangeText}</span>
                  </div>
                  <span>{Math.round(transcriptionProgress)}%</span>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  You can leave this page and come back later. We'll keep
                  processing in the background.
                </p>
              </div>
            )}

            {/* Completion message */}
            {transcriptionComplete && (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-green-700 font-medium">
                  ✓ Transcription complete! Now generating content...
                </p>
              </div>
            )}

            {/* Failed message */}
            {transcriptionFailed && (
              <div className="bg-destructive/10 rounded-lg p-4 text-center">
                <p className="text-destructive font-medium">
                  ✗ Transcription failed. Please try again.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flow Arrow */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-px w-16 bg-border" />
          <ChevronDown className="h-5 w-5" />
          <div className="h-px w-16 bg-border" />
        </div>
      </div>

      {/* Parallel Steps Section */}
      <Card
        className={cn(
          "border-2 transition-all",
          !transcriptionComplete && "opacity-50",
          transcriptionComplete && "border-green-500 shadow-lg",
        )}
      >
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Content Generation</h3>
              <Badge variant={transcriptionComplete ? "default" : "outline"}>
                {transcriptionComplete ? "In Progress" : "Waiting"}
              </Badge>
            </div>

            {!transcriptionComplete && (
              <p className="text-sm text-muted-foreground mb-6">
                These steps will start automatically after transcription
                completes
              </p>
            )}

            {/* Parallel Steps Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {parallelSteps.map((step) => {
                const Icon = step.icon;
                const stepUpdate = stepUpdates?.get(step.key);
                const hasRealtimeUpdate = !!stepUpdate;

                return (
                  <div key={step.key} className="space-y-2">
                    <div
                      className={cn(
                        "rounded-lg border p-4 transition-all",
                        !transcriptionComplete &&
                          "opacity-40 cursor-not-allowed",
                        step.status === "running" &&
                          "border-green-500 bg-green-50",
                        step.status === "completed" &&
                          "border-green-500 bg-green-50",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {step.label}
                          </span>
                        </div>
                        {step.status === "running" && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {step.status === "completed" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {step.status === "pending" && (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Badge
                        variant={
                          step.status === "completed" ? "default" : "outline"
                        }
                        className="text-xs"
                      >
                        {step.status === "pending" ? "Waiting" : step.status}
                      </Badge>
                    </div>

                    {/* Realtime Update Message - only show while running */}
                    {hasRealtimeUpdate &&
                      stepUpdate &&
                      step.status === "running" && (
                        <div className="text-xs text-primary/80 italic flex items-center gap-1 px-2">
                          <span>✨</span>
                          <span>{stepUpdate.message}</span>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
