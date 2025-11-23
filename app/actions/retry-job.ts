"use server";

/**
 * Server Action: Retry Failed Generation Job
 *
 * Allows users to retry individual AI generation steps that failed.
 * Also handles upgrade scenarios - if user upgraded, regenerates locked features.
 * Triggers a new Inngest event to regenerate just that specific output.
 */

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import type { Id } from "@/convex/_generated/dataModel";
// Removed getUserPlan - using Clerk's has() directly per docs
import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";

export type RetryableJob =
  | "keyMoments"
  | "summary"
  | "socialPosts"
  | "titles"
  | "hashtags"
  | "youtubeTimestamps";

export async function retryJob(projectId: Id<"projects">, job: RetryableJob) {
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

  // Get project to check what was already generated
  const project = await convex.query(api.projects.getProject, { projectId });

  if (!project) {
    throw new Error("Project not found");
  }

  // Infer original plan from what features were generated
  let originalPlan: "free" | "pro" | "ultra" = "free";
  if (project.keyMoments || project.youtubeTimestamps) {
    originalPlan = "ultra";
  } else if (project.socialPosts || project.titles || project.hashtags) {
    originalPlan = "pro";
  }

  // Trigger Inngest event to retry the specific job
  // Pass both original and current plans to detect upgrades
  await inngest.send({
    name: "podcast/retry-job",
    data: {
      projectId,
      job,
      userId,
      originalPlan,
      currentPlan,
    },
  });

  return { success: true };
}
