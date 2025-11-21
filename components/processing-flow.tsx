"use client";

import { ChevronDown, FileText, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GenerationOutputItem } from "@/components/processing-flow/generation-output-item";
import { PhaseCard } from "@/components/processing-flow/phase-card";
import { Badge } from "@/components/ui/badge";
import {
  ANIMATION_INTERVAL_MS,
  GENERATION_OUTPUTS,
  PROGRESS_CAP_PERCENTAGE,
} from "@/lib/constants";
import {
  estimateAssemblyAITime,
  formatTimeRange,
} from "@/lib/processing-time-estimator";
import type { PhaseStatus } from "@/lib/types";

interface ProcessingFlowProps {
  transcriptionStatus: PhaseStatus;
  generationStatus: PhaseStatus;
  fileDuration?: number;
  createdAt: number;
}

export function ProcessingFlow({
  transcriptionStatus,
  generationStatus,
  fileDuration,
  createdAt,
}: ProcessingFlowProps) {
  const isTranscribing = transcriptionStatus === "running";
  const transcriptionComplete = transcriptionStatus === "completed";
  const transcriptionInProgress =
    transcriptionStatus === "pending" || transcriptionStatus === "running";
  const isGenerating = generationStatus === "running";
  const generationComplete = generationStatus === "completed";

  // Memoize expensive calculations
  const timeEstimate = useMemo(
    () => estimateAssemblyAITime(fileDuration),
    [fileDuration],
  );

  const timeRangeText = useMemo(
    () => formatTimeRange(timeEstimate.bestCase, timeEstimate.conservative),
    [timeEstimate.bestCase, timeEstimate.conservative],
  );

  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [currentOutputIndex, setCurrentOutputIndex] = useState(0);

  useEffect(() => {
    if (!isTranscribing) {
      setTranscriptionProgress(0);
      return;
    }

    const updateProgress = () => {
      const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);
      const progress = (elapsedSeconds / timeEstimate.conservative) * 100;
      setTranscriptionProgress(Math.min(PROGRESS_CAP_PERCENTAGE, progress));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [isTranscribing, createdAt, timeEstimate.conservative]);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentOutputIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentOutputIndex((prev) => (prev + 1) % GENERATION_OUTPUTS.length);
    }, ANIMATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const getTranscriptionDescription = useCallback(() => {
    if (isTranscribing) return "Converting audio to text with AssemblyAI...";
    if (transcriptionComplete) return "Transcription complete!";
    return "Preparing transcription...";
  }, [isTranscribing, transcriptionComplete]);

  const getGenerationDescription = useCallback(() => {
    if (!transcriptionComplete) return "Waiting for transcription...";
    if (isGenerating) return "Generating 6 AI outputs in parallel...";
    if (generationComplete) return "All content generated!";
    return "Starting generation...";
  }, [transcriptionComplete, isGenerating, generationComplete]);

  return (
    <div className="space-y-6">
      <PhaseCard
        icon={<FileText className="h-6 w-6 text-primary" />}
        title="Phase 1: Transcription"
        description={getTranscriptionDescription()}
        status={transcriptionStatus}
        isActive={isTranscribing}
        progress={isTranscribing ? transcriptionProgress : undefined}
        timeEstimate={transcriptionInProgress ? timeRangeText : undefined}
      />

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-px w-16 bg-border" />
          <ChevronDown className="h-5 w-5" />
          <div className="h-px w-16 bg-border" />
        </div>
      </div>

      <PhaseCard
        icon={<Sparkles className="h-6 w-6 text-primary" />}
        title="Phase 2: AI Generation"
        description={getGenerationDescription()}
        status={generationStatus}
        isActive={isGenerating}
      >
        {isGenerating && (
          <div className="space-y-3 pt-2">
            {GENERATION_OUTPUTS.map((output, idx) => (
              <GenerationOutputItem
                key={output.name}
                name={output.name}
                description={output.description}
                icon={output.icon}
                isActive={idx === currentOutputIndex}
              />
            ))}

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

        {generationComplete && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {GENERATION_OUTPUTS.map((output) => (
              <Badge key={output.name} variant="default" className="text-xs">
                {output.name}
              </Badge>
            ))}
          </div>
        )}
      </PhaseCard>
    </div>
  );
}
