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

interface KeyMomentsTabProps {
  projectId: Id<"projects">;
  keyMoments?: {
    time: string;
    text: string;
    description: string;
  }[];
  error?: string;
}

export function KeyMomentsTab({ projectId, keyMoments, error }: KeyMomentsTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (error) {
    return <ErrorRetryCard projectId={projectId} job="keyMoments" errorMessage={error} />;
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

  if (!keyMoments || keyMoments.length === 0) {
    return (
      <Protect
        feature={FEATURES.KEY_MOMENTS}
        fallback={
          <UpgradePrompt
            feature="Key Moments"
            featureKey={FEATURES.KEY_MOMENTS}
            currentPlan="free"
          />
        }
      >
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No key moments detected</p>
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
      feature={FEATURES.KEY_MOMENTS}
      fallback={
        <UpgradePrompt
          feature="Key Moments"
          featureKey={FEATURES.KEY_MOMENTS}
          currentPlan="free"
        />
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Key Timestamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keyMoments.map((moment, idx) => (
              <div
                key={`${idx}-${moment.time}`}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <Badge variant="secondary" className="mt-1">
                  {moment.time}
                </Badge>
                <div>
                  <p className="font-medium">{moment.text}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {moment.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Protect>
  );
}
