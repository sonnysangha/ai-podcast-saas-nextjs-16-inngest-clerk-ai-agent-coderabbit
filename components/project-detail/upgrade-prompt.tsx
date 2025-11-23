/**
 * Upgrade Prompt Component
 *
 * Displays a card prompting users to upgrade when they try to access locked features.
 * Used in project detail tabs for features not available on their current plan.
 */

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_FEATURES, PLAN_NAMES, PLAN_PRICES, type PlanName } from "@/lib/tier-config";
import { getMinimumPlanForFeature, type FeatureName } from "@/lib/tier-utils";

interface UpgradePromptProps {
  feature: string; // Display name (e.g., "Social Posts")
  featureKey?: FeatureName; // Feature key for determining required plan
  requiredPlan?: PlanName; // Override required plan
  currentPlan: PlanName;
  className?: string;
}

export function UpgradePrompt({
  feature,
  featureKey,
  requiredPlan,
  currentPlan,
  className = "",
}: UpgradePromptProps) {
  // Determine the required plan for this feature
  const minPlan =
    requiredPlan || (featureKey ? getMinimumPlanForFeature(featureKey) : "pro");

  // Get features included in the required plan
  const planFeatures = PLAN_FEATURES[minPlan];
  const planName = PLAN_NAMES[minPlan];
  const planPrice = PLAN_PRICES[minPlan];

  return (
    <Card className={`border-2 border-dashed ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{feature} Locked</CardTitle>
        <CardDescription className="text-base">
          This feature is available on the <strong>{planName}</strong> plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature List */}
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-2">
                Unlock {feature} and more with {planName}:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {planFeatures.slice(0, 4).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {feat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </li>
                ))}
                {planFeatures.length > 4 && (
                  <li className="text-xs italic">+ {planFeatures.length - 4} more features</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Starting at <span className="font-bold text-lg text-foreground">{planPrice}</span>
          </p>

          {/* CTA Button */}
          <Link href={`/dashboard/upgrade?reason=feature&feature=${encodeURIComponent(feature)}`}>
            <Button size="lg" className="w-full">
              Upgrade to {planName}
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. No long-term contracts.
        </p>
      </CardContent>
    </Card>
  );
}

