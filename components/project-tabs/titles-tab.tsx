"use client";

import { Protect } from "@clerk/nextjs";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { GenerateMissingCard } from "@/components/project-detail/generate-missing-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";

interface TitlesTabProps {
  projectId: Id<"projects">;
  titles?: {
    youtubeShort: string[];
    youtubeLong: string[];
    podcastTitles: string[];
    seoKeywords: string[];
  };
  error?: string;
}

const TITLE_CATEGORIES = [
  {
    key: "youtubeShort" as const,
    title: "YouTube Short Titles",
    type: "list" as const,
  },
  {
    key: "youtubeLong" as const,
    title: "YouTube Long Titles",
    type: "list" as const,
  },
  {
    key: "podcastTitles" as const,
    title: "Podcast Titles",
    type: "list" as const,
  },
  {
    key: "seoKeywords" as const,
    title: "SEO Keywords",
    type: "badges" as const,
  },
];

export function TitlesTab({ projectId, titles, error }: TitlesTabProps) {
  if (error) {
    return <ErrorRetryCard projectId={projectId} job="titles" errorMessage={error} />;
  }

  if (!titles) {
    return (
      <Protect
        feature={FEATURES.TITLES}
        fallback={
          <UpgradePrompt
            feature="AI Title Suggestions"
            featureKey={FEATURES.TITLES}
            currentPlan="free"
          />
        }
      >
        <GenerateMissingCard
          projectId={projectId}
          message="No titles available"
        />
      </Protect>
    );
  }

  return (
    <Protect
      feature={FEATURES.TITLES}
      fallback={
        <UpgradePrompt
          feature="AI Title Suggestions"
          featureKey={FEATURES.TITLES}
          currentPlan="free"
        />
      }
    >
      <div className="space-y-6">
        {TITLE_CATEGORIES.map((category) => (
          <div key={category.key} className="glass-card rounded-2xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 gradient-emerald-text">{category.title}</h3>
            {category.type === "list" ? (
              <ul className="space-y-3">
                {titles[category.key].map((title, idx) => (
                  <li key={idx} className="p-3 md:p-4 glass-card rounded-xl border-l-4 border-l-emerald-400">
                    <p className="text-sm md:text-base text-gray-700 font-medium break-words">{title}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-wrap gap-2 md:gap-3">
                {titles[category.key].map((keyword, idx) => (
                  <Badge key={idx} className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm gradient-emerald text-white shadow-md break-words">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Protect>
  );
}
