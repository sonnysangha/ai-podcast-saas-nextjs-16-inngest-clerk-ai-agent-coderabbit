/**
 * Podcast Processing Workflow - Main Orchestration Function
 *
 * This is the core of the application - a durable, observable workflow that:
 * 1. Analyzes audio using AssemblyAI (transcription for AI use - runs for ALL plans)
 * 2. Generates AI content in parallel based on user's plan (FREE/PRO/ULTRA)
 * 3. Saves all results to Convex for real-time UI updates
 *
 * Feature Gating by Plan:
 * - FREE: Summary only
 * - PRO: + Social Posts, Titles, Hashtags
 * - ULTRA: + YouTube Timestamps, Key Moments, Full Transcript Access
 *
 * Note: Audio analysis (transcription) runs for ALL users to power AI features.
 * Speaker diarization data is always captured but only viewable to ULTRA users.
 *
 * Inngest Benefits for This Use Case:
 * - Durable execution: If OpenAI times out, the step retries automatically
 * - Parallel execution: AI jobs run simultaneously, reducing total time
 * - Real-time updates: UI shows progress via Convex subscriptions
 * - Observability: Full execution history and logs in Inngest dashboard
 * - Type safety: Events and steps are fully typed
 *
 * Triggered by: Server action after file upload to Vercel Blob
 * Event: "podcast/uploaded" with { projectId, fileUrl, userPlan }
 *
 * Workflow Pattern:
 * 1. Update project status to "processing"
 * 2. Transcribe audio (sequential - required for next steps)
 * 3. Generate content in parallel (conditionally based on plan)
 * 4. Save all results atomically to Convex
 *
 * Real-time Updates:
 * - Convex jobStatus updates trigger automatic UI re-renders
 * - No polling or manual refetching required
 * - UI always shows accurate status from database
 */
import { api } from "@/convex/_generated/api";
import { inngest } from "@/inngest/client";
import type { PlanName } from "@/lib/tier-config";
import { generateHashtags } from "../steps/ai-generation/hashtags";
import { generateKeyMoments } from "../steps/ai-generation/key-moments";
import { generateSocialPosts } from "../steps/ai-generation/social-posts";
import { generateSummary } from "../steps/ai-generation/summary";
import { generateTitles } from "../steps/ai-generation/titles";
import { generateYouTubeTimestamps } from "../steps/ai-generation/youtube-timestamps";
import { saveResultsToConvex } from "../steps/persistence/save-to-convex";
import { transcribeWithAssemblyAI } from "../steps/transcription/assemblyai";
import { convex } from "@/lib/convex-client";

export const podcastProcessor = inngest.createFunction(
  {
    id: "podcast-processor",
    // Optimizes parallel step execution (important for the 6 parallel AI jobs)
    optimizeParallelism: true,
    // Retry configuration: 3 attempts with exponential backoff
    retries: 3,
  },
  // Event trigger: sent by server action after upload
  { event: "podcast/uploaded" },
  async ({ event, step }) => {
    const { projectId, fileUrl, plan: userPlan } = event.data;
    const plan = (userPlan as PlanName) || "free"; // Default to free if not provided

    console.log(`Processing project ${projectId} for ${plan} plan`);

    try {
      // Mark project as processing in Convex (UI will show "Processing..." state)
      await step.run("update-status-processing", async () => {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          status: "processing",
        });
      });

      // Update jobStatus: transcription starting
      await step.run("update-job-status-transcription-running", async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          transcription: "running",
        });
      });

      // Step 1: Transcribe audio with AssemblyAI (sequential - blocks next steps)
      // This step is durable: if it fails, Inngest retries automatically
      // Speaker diarization is always enabled; UI access is gated by plan
      const transcript = await step.run("transcribe-audio", () =>
        transcribeWithAssemblyAI(fileUrl, projectId, plan)
      );

      // Update jobStatus: transcription complete
      await step.run("update-job-status-transcription-completed", async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          transcription: "completed",
        });
      });

      // Update jobStatus: content generation starting
      await step.run("update-job-status-generation-running", async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          contentGeneration: "running",
        });
      });

      // Step 2: Run AI generation tasks in parallel based on plan
      // Parallel Pattern: Promise.allSettled allows individual failures without blocking others
      // Performance: ~60s total vs. ~300s sequential (5x faster)
      // Each function can fail independently - we save whatever succeeds

      // Determine which jobs to run based on plan
      const jobs: Promise<any>[] = [];
      const jobNames: string[] = [];

      // Summary - available to all plans
      jobs.push(generateSummary(step, transcript));
      jobNames.push("summary");

      // PRO and ULTRA features
      if (plan === "pro" || plan === "ultra") {
        jobs.push(generateSocialPosts(step, transcript));
        jobNames.push("socialPosts");

        jobs.push(generateTitles(step, transcript));
        jobNames.push("titles");

        jobs.push(generateHashtags(step, transcript));
        jobNames.push("hashtags");
      } else {
        console.log(`Skipping social posts, titles, hashtags for ${plan} plan`);
      }

      // ULTRA-only features
      if (plan === "ultra") {
        jobs.push(generateKeyMoments(transcript));
        jobNames.push("keyMoments");

        jobs.push(generateYouTubeTimestamps(step, transcript));
        jobNames.push("youtubeTimestamps");
      } else {
        console.log(
          `Skipping key moments and YouTube timestamps for ${plan} plan`
        );
      }

      // Run all enabled jobs in parallel
      const results = await Promise.allSettled(jobs);

      // Extract successful results based on plan
      // Build results object dynamically based on what was run
      const generatedContent: Record<string, any> = {};

      results.forEach((result, idx) => {
        const jobName = jobNames[idx];
        if (result.status === "fulfilled") {
          generatedContent[jobName] = result.value;
        }
      });

      // Track errors for each failed job
      const jobErrors: Record<string, string> = {};

      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          const jobName = jobNames[idx];
          const errorMessage =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);

          jobErrors[jobName] = errorMessage;
          console.error(`Failed to generate ${jobName}:`, result.reason);
        }
      });

      // Save errors to Convex if any jobs failed
      if (Object.keys(jobErrors).length > 0) {
        await step.run("save-job-errors", () =>
          convex.mutation(api.projects.saveJobErrors, {
            projectId,
            jobErrors,
          })
        );
      }

      // Update jobStatus: content generation complete
      await step.run("update-job-status-generation-completed", async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          contentGeneration: "completed",
        });
      });

      // Step 3: Save all results to Convex in one atomic operation
      // Convex mutation updates the project, triggering UI re-render
      await step.run("save-results-to-convex", () =>
        saveResultsToConvex(projectId, generatedContent)
      );

      // Workflow complete - return success
      return { success: true, projectId, plan };
    } catch (error) {
      // Handle any errors that occur during the workflow
      console.error("Podcast processing failed:", error);

      // Update project status to failed with error details
      // NOTE: NOT wrapped in step.run() so this executes immediately, even during retries
      try {
        await convex.mutation(api.projects.recordError, {
          projectId,
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          step: "workflow",
          details: error instanceof Error ? error.stack : String(error),
        });
      } catch (cleanupError) {
        // If cleanup fails, log it but don't prevent the original error from being thrown
        console.error("Failed to update project status:", cleanupError);
      }

      // Re-throw to mark function as failed in Inngest (triggers retry if attempts remain)
      throw error;
    }
  }
);
