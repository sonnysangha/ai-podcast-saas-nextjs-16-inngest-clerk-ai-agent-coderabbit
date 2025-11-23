/**
 * Error Messages and Upgrade Prompts
 *
 * Generates user-friendly messages for plan limit violations and upgrade prompts.
 * Used across upload validation, UI components, and error handling.
 */

import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, type PlanName } from "./tier-config";

export interface UpgradeMessageDetails {
  title: string;
  message: string;
  suggestedPlan: PlanName;
  upgradeUrl: string;
}

/**
 * Generate contextual upgrade message based on the reason
 *
 * @param reason - Why the upgrade is needed
 * @param details - Additional context (file size, duration, count, etc.)
 * @returns Structured upgrade message with title, description, and URL
 */
export function getUpgradeMessage(
  reason: "file_size" | "duration" | "project_limit" | "feature_locked",
  details: {
    currentPlan?: PlanName;
    fileSize?: number; // bytes
    duration?: number; // seconds
    currentCount?: number;
    limit?: number;
    featureName?: string;
  } = {}
): UpgradeMessageDetails {
  const { currentPlan = "free", fileSize, duration, currentCount, limit, featureName } = details;

  // Determine suggested plan based on reason
  let suggestedPlan: PlanName = currentPlan === "free" ? "pro" : "ultra";

  switch (reason) {
    case "file_size": {
      const sizeMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(1) : "N/A";
      // If free and file < 200MB, suggest Pro. If > 200MB or already Pro, suggest Ultra
      if (currentPlan === "free" && fileSize && fileSize <= PLAN_LIMITS.pro.maxFileSize) {
        suggestedPlan = "pro";
      } else {
        suggestedPlan = "ultra";
      }

      const targetLimit = PLAN_LIMITS[suggestedPlan].maxFileSize;
      const targetLimitMB = (targetLimit / (1024 * 1024)).toFixed(0);

      return {
        title: "File Too Large",
        message: `Your file (${sizeMB}MB) exceeds your ${PLAN_NAMES[currentPlan]} plan limit. Upgrade to ${PLAN_NAMES[suggestedPlan]} for ${targetLimitMB}MB uploads.`,
        suggestedPlan,
        upgradeUrl: "/dashboard/upgrade?reason=file_size",
      };
    }

    case "duration": {
      const durationMin = duration ? Math.floor(duration / 60) : 0;
      // If free and duration < 2hr, suggest Pro. If > 2hr or already Pro, suggest Ultra
      if (currentPlan === "free" && duration && duration <= (PLAN_LIMITS.pro.maxDuration || 0)) {
        suggestedPlan = "pro";
      } else {
        suggestedPlan = "ultra";
      }

      const targetLimit = PLAN_LIMITS[suggestedPlan].maxDuration;
      const targetLimitText = targetLimit
        ? `${Math.floor(targetLimit / 60)} minutes`
        : "unlimited";

      return {
        title: "Duration Too Long",
        message: `Your podcast (${durationMin} minutes) exceeds your ${PLAN_NAMES[currentPlan]} plan limit. Upgrade to ${PLAN_NAMES[suggestedPlan]} for ${targetLimitText} duration.`,
        suggestedPlan,
        upgradeUrl: "/dashboard/upgrade?reason=duration",
      };
    }

    case "project_limit": {
      // If free, suggest Pro. If Pro, suggest Ultra
      suggestedPlan = currentPlan === "free" ? "pro" : "ultra";
      const targetLimit = PLAN_LIMITS[suggestedPlan].maxProjects;
      const targetLimitText = targetLimit === null ? "unlimited" : `${targetLimit}`;

      const countType = currentPlan === "free" ? "total" : "active";

      return {
        title: "Project Limit Reached",
        message: `You've reached your ${PLAN_NAMES[currentPlan]} plan limit of ${limit} ${countType} projects. Upgrade to ${PLAN_NAMES[suggestedPlan]} for ${targetLimitText} projects.`,
        suggestedPlan,
        upgradeUrl: "/dashboard/upgrade?reason=projects",
      };
    }

    case "feature_locked": {
      // Determine required plan based on feature
      // Most features are Pro, advanced features (timestamps, key moments) are Ultra
      const ultraFeatures = ["YouTube Timestamps", "Key Moments", "Speaker Diarization"];
      const requiredPlan = ultraFeatures.includes(featureName || "") ? "ultra" : "pro";
      suggestedPlan = requiredPlan;

      return {
        title: `${featureName || "Feature"} Not Available`,
        message: `${featureName || "This feature"} is available on the ${PLAN_NAMES[requiredPlan]} plan (${PLAN_PRICES[requiredPlan]}). Upgrade to unlock this feature.`,
        suggestedPlan,
        upgradeUrl: `/dashboard/upgrade?reason=feature&feature=${encodeURIComponent(featureName || "premium")}`,
      };
    }

    default:
      return {
        title: "Upgrade Required",
        message: "This action requires a higher plan.",
        suggestedPlan: "pro",
        upgradeUrl: "/dashboard/upgrade",
      };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

