"use client";

import { Protect } from "@clerk/nextjs";
import { GenerateMissingCard } from "@/components/project-detail/generate-missing-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";

interface TranscriptTabProps {
  projectId: Id<"projects">;
  transcript: {
    speakers?: {
      speaker: string;
      text: string;
      start: number;
      confidence: number;
    }[];
  };
}

export function TranscriptTab({ projectId, transcript }: TranscriptTabProps) {
  const hasSpeakers = transcript.speakers && transcript.speakers.length > 0;

  // Color palette for speakers - cycles through these colors
  const speakerColors = [
    "gradient-emerald text-white", // Green
    "bg-blue-500 text-white", // Blue
    "bg-rose-500 text-white", // Rose/Pink
    "bg-amber-500 text-white", // Amber/Orange
    "bg-purple-500 text-white", // Purple
    "bg-cyan-500 text-white", // Cyan
    "bg-pink-500 text-white", // Pink
    "bg-indigo-500 text-white", // Indigo
    "bg-orange-500 text-white", // Orange
    "bg-teal-500 text-white", // Teal
  ];

  // Get unique speakers and create a color mapping
  const getSpeakerColor = (speaker: string) => {
    if (!transcript.speakers) return speakerColors[0];
    const uniqueSpeakers = Array.from(
      new Set(transcript.speakers.map((s) => s.speaker)),
    ).sort();
    const speakerIndex = uniqueSpeakers.indexOf(speaker);
    return speakerColors[speakerIndex % speakerColors.length];
  };

  if (!hasSpeakers) {
    return (
      <Protect
        feature={FEATURES.SPEAKER_DIARIZATION}
        fallback={
          <UpgradePrompt
            feature="Speaker Diarization"
            featureKey={FEATURES.SPEAKER_DIARIZATION}
            currentPlan="free"
          />
        }
      >
        <GenerateMissingCard
          projectId={projectId}
          message="No speaker diarization data available"
        />
      </Protect>
    );
  }

  return (
    <Protect
      feature={FEATURES.SPEAKER_DIARIZATION}
      fallback={
        <UpgradePrompt
          feature="Speaker Diarization"
          featureKey={FEATURES.SPEAKER_DIARIZATION}
          currentPlan="free"
        />
      }
    >
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-bold gradient-emerald-text mb-2">
            Speaker Dialogue
          </h3>
          <p className="text-sm text-gray-600">
            AssemblyAI identified{" "}
            {new Set(transcript.speakers?.map((s) => s.speaker)).size}{" "}
            speaker(s) in this podcast
          </p>
        </div>
        <div className="space-y-4 md:space-y-6">
          {transcript.speakers?.map((utterance) => (
            <div
              key={`${utterance.start}-${utterance.speaker}`}
              className="flex gap-3 md:gap-4 items-start p-4 md:p-5 glass-card rounded-xl border-l-4 border-l-emerald-400"
            >
              <Badge
                className={`mt-1 shrink-0 px-3 py-1.5 text-sm font-bold shadow-md ${getSpeakerColor(
                  utterance.speaker,
                )}`}
              >
                Speaker {utterance.speaker}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0 border-emerald-200 text-emerald-700"
                  >
                    {new Date(utterance.start * 1000)
                      .toISOString()
                      .substr(11, 8)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {Math.round(utterance.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed break-words">
                  {utterance.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Protect>
  );
}
