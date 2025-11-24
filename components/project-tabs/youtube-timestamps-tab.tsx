"use client";

import { Protect } from "@clerk/nextjs";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { GenerateMissingCard } from "@/components/project-detail/generate-missing-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";
import { Check, Copy } from "lucide-react";
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

  if (error) {
    return <ErrorRetryCard projectId={projectId} job="youtubeTimestamps" errorMessage={error} />;
  }

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
        <GenerateMissingCard
          projectId={projectId}
          message="No YouTube timestamps available"
        />
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
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold gradient-emerald-text mb-2">
              YouTube Timestamps
            </h3>
            <p className="text-sm text-gray-600">
              Copy these timestamps and paste them into your YouTube video
              description. YouTube will automatically create clickable chapter
              markers.
            </p>
          </div>
          <Button
            onClick={handleCopyAll}
            className="gradient-emerald text-white hover-glow shadow-lg gap-2 shrink-0"
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
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-4 md:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
            <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm break-words text-gray-800">
              {formattedTimestamps}
            </pre>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="text-base md:text-lg font-bold text-gray-900">
              Individual Timestamps:
            </h4>
            <div className="space-y-3">
              {timestamps.map((timestamp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 md:gap-4 p-4 md:p-5 glass-card rounded-xl border-l-4 border-l-emerald-400"
                >
                  <code className="text-sm md:text-base font-mono font-bold gradient-emerald text-white px-3 py-1.5 rounded-lg shadow-md shrink-0">
                    {timestamp.timestamp}
                  </code>
                  <p className="text-sm md:text-base text-gray-700 flex-1 min-w-0 break-words leading-relaxed">
                    {timestamp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Protect>
  );
}
