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
  const [isGenerating, setIsGenerating] = useState(false);

  if (error) {
    return <ErrorRetryCard projectId={projectId} job="hashtags" errorMessage={error} />;
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
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No hashtags available</p>
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
      feature={FEATURES.HASHTAGS}
      fallback={
        <UpgradePrompt
          feature="AI Hashtags"
          featureKey={FEATURES.HASHTAGS}
          currentPlan="free"
        />
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Platform Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PLATFORMS.map((platform) => (
              <div key={platform.key}>
                <p className="text-sm font-medium mb-2">{platform.title}</p>
                <div className="flex flex-wrap gap-2">
                  {hashtags[platform.key].map((tag, idx) => (
                    <Badge key={`${platform.key}-${idx}`} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Protect>
  );
}
