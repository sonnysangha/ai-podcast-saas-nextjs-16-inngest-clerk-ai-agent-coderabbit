/**
 * Tier Utilities for Plan Detection and Validation
 *
 * Provides functions to:
 * - Validate uploads against plan limits using Clerk's has() method
 * - Check feature access
 *
 * All plan checks use Clerk's native billing system per:
 * https://clerk.com/docs/nextjs/guides/billing/for-b2c
 */

import type { Auth } from "@clerk/nextjs/server";
import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import {
  FEATURES,
  PLAN_FEATURES,
  PLAN_LIMITS,
  type FeatureName,
  type PlanLimits,
  type PlanName,
} from "./tier-config";

export interface UploadValidationResult {
  allowed: boolean;
  reason?: "file_size" | "duration" | "project_limit";
  message?: string;
  currentCount?: number;
  limit?: number;
}

/**
 * Validate if user can upload a file based on their plan limits
 *
 * Checks:
 * 1. File size against plan limit
 * 2. Duration against plan limit (if provided)
 * 3. Project count against plan limit
 *
 * @param auth - Clerk auth object
 * @param userId - User ID for project counting
 * @param fileSize - File size in bytes
 * @param duration - Optional duration in seconds
 * @returns Validation result with details
 */
export async function checkUploadLimits(
  auth: Auth,
  userId: string,
  fileSize: number,
  duration?: number
): Promise<UploadValidationResult> {
  // Get user's plan using Clerk's has() method
  const { has } = auth;
  let plan: PlanName = "free";
  if (has?.({ plan: "ultra" })) {
    plan = "ultra";
  } else if (has?.({ plan: "pro" })) {
    plan = "pro";
  }
  
  const limits = PLAN_LIMITS[plan];

  // Check file size limit
  if (fileSize > limits.maxFileSize) {
    return {
      allowed: false,
      reason: "file_size",
      message: `File size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds your plan limit of ${(limits.maxFileSize / (1024 * 1024)).toFixed(0)}MB`,
    };
  }

  // Check duration limit (if duration provided and plan has limit)
  if (duration && limits.maxDuration && duration > limits.maxDuration) {
    const durationMinutes = Math.floor(duration / 60);
    const limitMinutes = Math.floor(limits.maxDuration / 60);
    return {
      allowed: false,
      reason: "duration",
      message: `Duration (${durationMinutes} minutes) exceeds your plan limit of ${limitMinutes} minutes`,
    };
  }

  // Check project count limit (skip for ultra - unlimited)
  if (limits.maxProjects !== null) {
    // FREE: count all projects (including deleted)
    // PRO: count only active projects
    const includeDeleted = plan === "free";
    const projectCount = await convex.query(api.projects.getUserProjectCount, {
      userId,
      includeDeleted,
    });

    if (projectCount >= limits.maxProjects) {
      return {
        allowed: false,
        reason: "project_limit",
        message: `You've reached your plan limit of ${limits.maxProjects} ${plan === "free" ? "total" : "active"} projects`,
        currentCount: projectCount,
        limit: limits.maxProjects,
      };
    }
  }

  // All checks passed
  return { allowed: true };
}

/**
 * Check if user has access to a specific feature
 *
 * Uses Clerk's has() method for feature-level checking
 *
 * @param auth - Clerk auth object
 * @param feature - Feature name to check
 * @returns True if user has access to feature
 */
export function checkFeatureAccess(
  auth: Auth,
  feature: FeatureName
): boolean {
  const { has } = auth;
  return has ? has({ feature }) : false;
}

/**
 * Get list of features available to a plan
 *
 * @param plan - Plan name
 * @returns Array of feature names available to the plan
 */
export function getPlanFeatures(plan: PlanName): FeatureName[] {
  return PLAN_FEATURES[plan];
}

/**
 * Check if a plan has a specific feature
 *
 * @param plan - Plan name
 * @param feature - Feature to check
 * @returns True if plan includes feature
 */
export function planHasFeature(plan: PlanName, feature: FeatureName): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

/**
 * Get the minimum plan required for a feature
 *
 * @param feature - Feature name
 * @returns Minimum plan name that includes this feature
 */
export function getMinimumPlanForFeature(feature: FeatureName): PlanName {
  if (PLAN_FEATURES.free.includes(feature)) return "free";
  if (PLAN_FEATURES.pro.includes(feature)) return "pro";
  return "ultra";
}

