/**
 * Upgrade Prompt Component
 *
 * Displays a card prompting users to upgrade when they try to access locked features.
 * Used in project detail tabs for features not available on their current plan.
 */

import { Lock, Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <div className={`glass-card rounded-3xl border-2 border-dashed border-emerald-200 ${className}`}>
      <div className="text-center p-8 md:p-12">
        <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Lock className="h-10 w-10 text-gray-600" />
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold mb-3">{feature} Locked</h3>
        <p className="text-base md:text-lg text-gray-600 mb-8">
          This feature is available on the <strong className="text-emerald-600">{planName}</strong> plan
        </p>

        {/* Feature List */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 mb-8 text-left">
          <div className="flex items-start gap-3 mb-4">
            {minPlan === "ultra" ? (
              <Crown className="h-6 w-6 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <Sparkles className="h-6 w-6 text-emerald-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-bold text-base md:text-lg mb-4 text-gray-900">
                Unlock {feature} and more with {planName}:
              </p>
              <ul className="space-y-3 text-sm md:text-base text-gray-700">
                {planFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold text-lg">✓</span>
                    <span className="font-medium">
                      {feat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-6">
            Starting at <span className="font-extrabold text-2xl md:text-3xl text-gray-900">{planPrice}</span>
          </p>

          {/* CTA Button */}
          <Link href={`/dashboard/upgrade?reason=feature&feature=${encodeURIComponent(feature)}`}>
            <Button size="lg" className="gradient-emerald text-white hover-glow px-8 md:px-10 py-5 md:py-6 text-base md:text-lg rounded-xl font-bold w-full md:w-auto">
              Upgrade to {planName}
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Cancel anytime. No long-term contracts.
        </p>
      </div>
    </div>
  );
}

