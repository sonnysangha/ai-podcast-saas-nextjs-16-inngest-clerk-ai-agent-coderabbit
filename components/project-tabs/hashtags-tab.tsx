"use client";

import { Protect } from "@clerk/nextjs";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { GenerateMissingCard } from "@/components/project-detail/generate-missing-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";

interface HashtagsTabProps {
  projectId: Id<"projects">;
  hashtags?: {
    youtube: string[];
    instagram: string[];
    tiktok: string[];
    linkedin: string[];
    twitter: string[];
  };
  error?: string;
}

const PLATFORMS = [
  { key: "youtube" as const, title: "YouTube" },
  { key: "instagram" as const, title: "Instagram" },
  { key: "tiktok" as const, title: "TikTok" },
  { key: "linkedin" as const, title: "LinkedIn" },
  { key: "twitter" as const, title: "Twitter" },
];

export function HashtagsTab({ projectId, hashtags, error }: HashtagsTabProps) {
  if (error) {
    return (
      <ErrorRetryCard
        projectId={projectId}
        job="hashtags"
        errorMessage={error}
      />
    );
  }

  if (!hashtags) {
    return (
      <Protect
        feature={FEATURES.HASHTAGS}
        fallback={
          <UpgradePrompt
            feature="AI Hashtags"
            featureKey={FEATURES.HASHTAGS}
            currentPlan="free"
          />
        }
      >
        <GenerateMissingCard
          projectId={projectId}
          message="No hashtags available"
        />
      </Protect>
    );
  }

  return (
    <Protect
      feature={FEATURES.HASHTAGS}
      fallback={
        <UpgradePrompt
          feature="AI Hashtags"
          featureKey={FEATURES.HASHTAGS}
          currentPlan="free"
        />
      }
    >
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 gradient-emerald-text">
          Platform Hashtags
        </h3>
        <div className="space-y-4 md:space-y-6">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.key}
              className="p-4 md:p-5 glass-card rounded-xl"
            >
              <p className="text-sm md:text-base font-bold mb-3 md:mb-4 text-gray-900">
                {platform.title}
              </p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {hashtags[platform.key].map((tag, idx) => (
                  <Badge
                    key={`${platform.key}-${idx}`}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-emerald-100 text-emerald-700 border-emerald-200 break-words"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Protect>
  );
}
