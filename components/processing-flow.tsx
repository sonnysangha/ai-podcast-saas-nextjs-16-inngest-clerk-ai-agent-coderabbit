"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Loader2,
  ChevronDown,
  FileText,
  Sparkles,
  Clock,
  Hash,
  MessageSquare,
  Heading,
  Youtube,
  Target,
  FileSignature,
} from "lucide-react";
import {
  estimateAssemblyAITime,
  formatTimeRange,
} from "@/lib/processing-time-estimator";
import { cn } from "@/lib/utils";

type PhaseStatus = "pending" | "running" | "completed";

interface ProcessingFlowProps {
  transcriptionStatus: PhaseStatus;
  generationStatus: PhaseStatus;
  fileDuration?: number;
  createdAt: number;
}

// Generation outputs with descriptions
const GENERATION_OUTPUTS = [
  {
    name: "Summary",
    icon: FileSignature,
    description:
      "Creating comprehensive podcast summary with key insights and takeaways",
  },
  {
    name: "Key Moments",
    icon: Target,
    description:
      "Identifying important timestamps, highlights, and memorable quotes",
  },
  {
    name: "Social Posts",
    icon: MessageSquare,
    description:
      "Crafting platform-optimized posts for Twitter, LinkedIn, Instagram, TikTok, YouTube, and Facebook",
  },
  {
    name: "Titles",
    icon: Heading,
    description:
      "Generating engaging SEO-optimized titles and keywords for maximum reach",
  },
  {
    name: "Hashtags",
    icon: Hash,
    description:
      "Creating trending platform-specific hashtag strategies for better discoverability",
  },
  {
    name: "YouTube Timestamps",
    icon: Youtube,
    description:
      "Formatting clickable chapter markers for YouTube video descriptions",
  },
];

export function ProcessingFlow({
  transcriptionStatus,
  generationStatus,
  fileDuration,
  createdAt,
}: ProcessingFlowProps) {
  const isTranscribing = transcriptionStatus === "running";
  const transcriptionComplete = transcriptionStatus === "completed";

  const isGenerating = generationStatus === "running";
  const generationComplete = generationStatus === "completed";

  // Get real time estimates based on audio duration
  const timeEstimate = estimateAssemblyAITime(fileDuration);
  const timeRangeText = formatTimeRange(
    timeEstimate.bestCase,
    timeEstimate.conservative,
  );

  // Track progress based on elapsed time vs conservative estimate
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  // Cycle through generation outputs to show what's being worked on
  const [currentOutputIndex, setCurrentOutputIndex] = useState(0);

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

  // Cycle through outputs every 4 seconds during generation
  useEffect(() => {
    if (!isGenerating) {
      setCurrentOutputIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentOutputIndex((prev) => (prev + 1) % GENERATION_OUTPUTS.length);
    }, 4000); // 4 seconds per step

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="space-y-6">
      {/* Phase 1: Transcription */}
      <Card
        className={cn(
          "border-2 transition-all",
          isTranscribing && "border-primary shadow-lg",
          transcriptionComplete && "border-green-500",
        )}
      >
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Phase 1: Transcription</h3>
                  <p className="text-sm text-muted-foreground">
                    {isTranscribing &&
                      "Converting audio to text with AssemblyAI..."}
                    {transcriptionComplete && "Transcription complete!"}
                    {transcriptionStatus === "pending" &&
                      "Preparing transcription..."}
                  </p>
                </div>
              </div>

              {/* Status Icon */}
              <div>
                {isTranscribing && (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                )}
                {transcriptionComplete && (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
            </div>

            {/* Progress (when running) */}
            {isTranscribing && (
              <div className="space-y-3">
                <Progress value={transcriptionProgress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Estimated: {timeRangeText}</span>
                  </div>
                  <span>{Math.round(transcriptionProgress)}%</span>
                </div>
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

      {/* Phase 2: AI Generation */}
      <Card
        className={cn(
          "border-2 transition-all",
          !transcriptionComplete && "opacity-50",
          isGenerating && "border-primary shadow-lg",
          generationComplete && "border-green-500",
        )}
      >
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Phase 2: AI Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    {!transcriptionComplete && "Waiting for transcription..."}
                    {isGenerating && "Generating 6 AI outputs in parallel..."}
                    {generationComplete && "All content generated!"}
                    {transcriptionComplete &&
                      generationStatus === "pending" &&
                      "Starting generation..."}
                  </p>
                </div>
              </div>

              {/* Status Icon */}
              <div>
                {isGenerating && (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                )}
                {generationComplete && (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
            </div>

            {/* Cycling outputs while generating - All visible with spinners */}
            {isGenerating && (
              <div className="space-y-3 pt-2">
                {GENERATION_OUTPUTS.map((output, idx) => {
                  const Icon = output.icon;
                  const isActive = idx === currentOutputIndex;

                  return (
                    <div
                      key={output.name}
                      className={cn(
                        "border rounded-lg transition-all duration-700 ease-in-out",
                        isActive
                          ? "bg-primary/5 border-primary shadow-md scale-[1.02]"
                          : "bg-muted/20 border-muted/40 opacity-40 scale-100",
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "rounded-full p-2.5 transition-all duration-500",
                              isActive
                                ? "bg-primary/10 ring-2 ring-primary/20"
                                : "bg-muted/50",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5 transition-all duration-500",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground/60",
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4
                                className={cn(
                                  "font-semibold text-sm transition-all duration-500",
                                  isActive
                                    ? "text-primary"
                                    : "text-foreground/60",
                                )}
                              >
                                {output.name}
                              </h4>
                              <Loader2
                                className={cn(
                                  "h-4 w-4 animate-spin transition-all duration-500",
                                  isActive
                                    ? "text-primary opacity-100"
                                    : "text-muted-foreground/40 opacity-50",
                                )}
                              />
                            </div>
                            <p
                              className={cn(
                                "text-sm transition-all duration-500",
                                isActive
                                  ? "text-muted-foreground opacity-100"
                                  : "text-muted-foreground/50 opacity-60",
                              )}
                            >
                              {output.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Info text */}
                <div className="bg-linear-to-r from-primary/5 to-primary/10 rounded-lg p-4 text-center mt-4 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Powered by Inngest
                    </span>{" "}
                    — AI is generating all {GENERATION_OUTPUTS.length} outputs
                    simultaneously
                  </p>
                </div>
              </div>
            )}

            {/* Completed state - show all badges */}
            {generationComplete && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {GENERATION_OUTPUTS.map((output) => (
                  <Badge
                    key={output.name}
                    variant="default"
                    className="text-xs"
                  >
                    {output.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
