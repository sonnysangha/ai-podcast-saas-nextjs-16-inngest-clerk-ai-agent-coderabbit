"use client";

import { Protect } from "@clerk/nextjs";
import { generateMissingFeatures } from "@/app/actions/generate-missing-features";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";
import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type YouTubeTimestamp = {
  timestamp: string;
  description: string;
};

type YouTubeTimestampsTabProps = {
  projectId: Id<"projects">;
  timestamps?: YouTubeTimestamp[];
  error?: string;
};

export function YouTubeTimestampsTab({
  projectId,
  timestamps,
  error,
}: YouTubeTimestampsTabProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (error) {
    return <ErrorRetryCard projectId={projectId} job="youtubeTimestamps" errorMessage={error} />;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMissingFeatures(projectId);
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate features",
      );
      setIsGenerating(false);
    }
  };

  if (!timestamps || timestamps.length === 0) {
    return (
      <Protect
        feature={FEATURES.YOUTUBE_TIMESTAMPS}
        fallback={
          <UpgradePrompt
            feature="YouTube Timestamps"
            featureKey={FEATURES.YOUTUBE_TIMESTAMPS}
            currentPlan="free"
          />
        }
      >
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No YouTube timestamps available</p>
            <p className="text-sm text-muted-foreground">
              It looks like this project was processed before you upgraded.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate All Missing Features"}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will generate all features available in your current plan
            </p>
          </CardContent>
        </Card>
      </Protect>
    );
  }

  const formattedTimestamps = timestamps
    .map((t) => `${t.timestamp} ${t.description}`)
    .join("\n");

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formattedTimestamps);
      setCopied(true);
      toast.success("Timestamps copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy timestamps");
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Protect
      feature={FEATURES.YOUTUBE_TIMESTAMPS}
      fallback={
        <UpgradePrompt
          feature="YouTube Timestamps"
          featureKey={FEATURES.YOUTUBE_TIMESTAMPS}
          currentPlan="free"
        />
      }
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>YouTube Timestamps</CardTitle>
          <Button
            onClick={handleCopyAll}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy these timestamps and paste them into your YouTube video
              description. YouTube will automatically create clickable chapter
              markers.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {formattedTimestamps}
              </pre>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Individual Timestamps:</h4>
              <div className="space-y-2">
                {timestamps.map((timestamp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <code className="text-sm font-mono font-semibold text-primary min-w-[60px]">
                      {timestamp.timestamp}
                    </code>
                    <p className="text-sm flex-1">{timestamp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Protect>
  );
}
