"use client";

import { Protect } from "@clerk/nextjs";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { GenerateMissingCard } from "@/components/project-detail/generate-missing-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";

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
  if (error) {
    return <ErrorRetryCard projectId={projectId} job="keyMoments" errorMessage={error} />;
  }

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
        <GenerateMissingCard
          projectId={projectId}
          message="No key moments detected"
        />
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
      <div className="glass-card rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-8 gradient-emerald-text">Key Timestamps</h3>
        <div className="space-y-6">
          {keyMoments.map((moment, idx) => (
            <div
              key={`${idx}-${moment.time}`}
              className="flex items-start gap-4 md:gap-6 p-4 md:p-6 glass-card rounded-xl border-l-4 border-l-emerald-400"
            >
              <Badge className="mt-1 gradient-emerald text-white px-3 py-2 text-sm md:text-base font-bold shadow-md shrink-0">
                {moment.time}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base md:text-lg text-gray-900 mb-2 break-words">{moment.text}</p>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed break-words">
                  {moment.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Protect>
  );
}
