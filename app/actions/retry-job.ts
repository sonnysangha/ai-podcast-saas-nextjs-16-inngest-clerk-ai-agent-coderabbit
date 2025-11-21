"use server";

/**
 * Server Action: Retry Failed Generation Job
 *
 * Allows users to retry individual AI generation steps that failed.
 * Triggers a new Inngest event to regenerate just that specific output.
 */

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import type { Id } from "@/convex/_generated/dataModel";

export type RetryableJob =
  | "keyMoments"
  | "summary"
  | "socialPosts"
  | "titles"
  | "hashtags"
  | "youtubeTimestamps";

export async function retryJob(projectId: Id<"projects">, job: RetryableJob) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Trigger Inngest event to retry the specific job
  await inngest.send({
    name: "podcast/retry-job",
    data: {
      projectId,
      job,
      userId,
    },
  });

  return { success: true };
}



