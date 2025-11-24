"use server";

/**
 * Server Action: Generate All Missing Features After Upgrade
 *
 * When a user upgrades their plan, this action triggers generation of ALL
 * features available in their new plan that weren't generated when the project
 * was processed on their old plan.
 *
 * Example: User had Free plan (only Summary), upgrades to Pro.
 * This will generate: Social Posts, Titles, Hashtags all at once.
 *
 * Note: Transcription is NOT a feature - it's available to all users.
 */

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import type { Id } from "@/convex/_generated/dataModel";
// Removed getUserPlan - using Clerk's has() directly per docs
import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { PLAN_FEATURES } from "@/lib/tier-config";
import type { RetryableJob } from "./retry-job";

/**
 * Generate all missing features for user's current plan
 *
 * Determines which features are available in current plan but missing from project,
 * then triggers parallel Inngest jobs to generate them all at once.
 */
export async function generateMissingFeatures(projectId: Id<"projects">) {
  const authObj = await auth();
  const { userId, has } = authObj;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get user's current plan using Clerk's has() method
  let currentPlan: "free" | "pro" | "ultra" = "free";
  if (has?.({ plan: "ultra" })) {
    currentPlan = "ultra";
  } else if (has?.({ plan: "pro" })) {
    currentPlan = "pro";
  }

  // Get project to check what's already generated
  const project = await convex.query(api.projects.getProject, { projectId });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.userId !== userId) {
    throw new Error("Unauthorized - not your project");
  }

  // Infer what plan was used during processing based on generated features
  let originalPlan: "free" | "pro" | "ultra" = "free";
  if (project.keyMoments || project.youtubeTimestamps) {
    originalPlan = "ultra";
  } else if (project.socialPosts || project.titles || project.hashtags) {
    originalPlan = "pro";
  }

  // Get all features available in current plan
  const availableFeatures = PLAN_FEATURES[currentPlan];

  // Map feature names to job names and check what's missing
  const featureToJob: Record<string, RetryableJob> = {
    social_posts: "socialPosts",
    titles: "titles",
    hashtags: "hashtags",
    key_moments: "keyMoments",
    youtube_timestamps: "youtubeTimestamps",
  };

  const missingJobs: RetryableJob[] = [];

  // Check which features are available but not yet generated
  for (const feature of availableFeatures) {
    const jobName = featureToJob[feature];
    if (!jobName) continue; // Skip transcription and summary (always present)

    // Check if this data exists in the project
    const hasData = Boolean(project[jobName as keyof typeof project]);

    if (!hasData) {
      missingJobs.push(jobName);
    }
  }

  if (missingJobs.length === 0) {
    throw new Error(
      "No missing features to generate. All features for your plan are already available."
    );
  }

  // Trigger Inngest jobs for all missing features in parallel
  await Promise.all(
    missingJobs.map((job) =>
      inngest.send({
        name: "podcast/retry-job",
        data: {
          projectId,
          job,
          userId,
          originalPlan,
          currentPlan,
        },
      })
    )
  );

  return {
    success: true,
    generated: missingJobs,
    message: `Generating ${missingJobs.length} feature${
      missingJobs.length > 1 ? "s" : ""
    }: ${missingJobs.join(", ")}`,
  };
}
