"use client";

import { Protect } from "@clerk/nextjs";
import { generateMissingFeatures } from "@/app/actions/generate-missing-features";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [isGenerating, setIsGenerating] = useState(false);

  if (error) {
    return <ErrorRetryCard projectId={projectId} job="titles" errorMessage={error} />;
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
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No titles available</p>
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
      <div className="space-y-4">
        {TITLE_CATEGORIES.map((category) => (
          <Card key={category.key}>
            <CardHeader>
              <CardTitle>{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {category.type === "list" ? (
                <ul className="space-y-2">
                  {titles[category.key].map((title, idx) => (
                    <li key={idx} className="p-3 border rounded-lg">
                      {title}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {titles[category.key].map((keyword, idx) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Protect>
  );
}
