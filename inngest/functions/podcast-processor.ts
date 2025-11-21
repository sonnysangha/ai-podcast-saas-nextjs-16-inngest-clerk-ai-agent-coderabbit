/**
 * Podcast Processing Workflow - Main Orchestration Function
 *
 * This is the core of the application - a durable, observable workflow that:
 * 1. Transcribes audio using AssemblyAI
 * 2. Generates 6 types of AI content in parallel using OpenAI
 * 3. Saves all results to Convex for real-time UI updates
 *
 * Inngest Benefits for This Use Case:
 * - Durable execution: If OpenAI times out, the step retries automatically
 * - Parallel execution: 6 AI jobs run simultaneously, reducing total time by ~5x
 * - Real-time updates: UI shows progress via Convex subscriptions
 * - Observability: Full execution history and logs in Inngest dashboard
 * - Type safety: Events and steps are fully typed
 *
 * Triggered by: Server action after file upload to Vercel Blob
 * Event: "podcast/uploaded" with { projectId, fileUrl }
 *
 * Workflow Pattern:
 * 1. Update project status to "processing"
 * 2. Transcribe audio (sequential - required for next steps)
 * 3. Generate content in parallel (Promise.all - 6 independent AI jobs)
 * 4. Save all results atomically to Convex
 *
 * Real-time Updates:
 * - Convex jobStatus updates trigger automatic UI re-renders
 * - No polling or manual refetching required
 * - UI always shows accurate status from database
 */
import { api } from "@/convex/_generated/api";
import { inngest } from "@/inngest/client";
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
    const { projectId, fileUrl } = event.data;

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
      const transcript = await step.run("transcribe-audio", () =>
        transcribeWithAssemblyAI(fileUrl, projectId)
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

      // Step 2: Run 6 AI generation tasks in parallel
      // Parallel Pattern: Promise.allSettled allows individual failures without blocking others
      // Performance: ~60s total vs. ~300s sequential (5x faster)
      // Each function can fail independently - we save whatever succeeds
      const results = await Promise.allSettled([
        generateKeyMoments(transcript),
        generateSummary(step, transcript),
        generateSocialPosts(step, transcript),
        generateTitles(step, transcript),
        generateHashtags(step, transcript),
        generateYouTubeTimestamps(step, transcript),
      ]);

      // Extract successful results, log failures
      const keyMoments =
        results[0].status === "fulfilled" ? results[0].value : undefined;
      const summary =
        results[1].status === "fulfilled" ? results[1].value : undefined;
      const socialPosts =
        results[2].status === "fulfilled" ? results[2].value : undefined;
      const titles =
        results[3].status === "fulfilled" ? results[3].value : undefined;
      const hashtags =
        results[4].status === "fulfilled" ? results[4].value : undefined;
      const youtubeTimestamps =
        results[5].status === "fulfilled" ? results[5].value : undefined;

      // Track errors for each failed job
      const jobErrors: Record<string, string> = {};
      const generationNames = [
        "keyMoments",
        "summary",
        "socialPosts",
        "titles",
        "hashtags",
        "youtubeTimestamps",
      ];

      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          const jobName = generationNames[idx];
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
        saveResultsToConvex(projectId, {
          keyMoments,
          summary,
          socialPosts,
          titles,
          hashtags,
          youtubeTimestamps,
        })
      );

      // Workflow complete - return success
      return { success: true, projectId };
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
