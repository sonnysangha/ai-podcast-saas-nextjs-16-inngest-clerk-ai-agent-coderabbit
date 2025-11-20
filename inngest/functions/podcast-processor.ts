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
 * - Real-time updates: UI shows progress as each step completes
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
 * - publish() sends progress events to subscribed frontend clients
 * - Frontend hook (useProjectRealtime) receives these events
 * - UI updates without polling or manual refetching
 */
import { api } from "@/convex/_generated/api";
import { inngest } from "@/inngest/client";
import { REALTIME_TOPICS } from "../lib/realtime-topics";
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
  },
  // Event trigger: sent by server action after upload
  { event: "podcast/uploaded" },
  async ({ event, step, publish }) => {
    const { projectId, fileUrl } = event.data;

    // Mark project as processing in Convex (UI will show "Processing..." state)
    await step.run("update-status-processing", async () => {
      await convex.mutation(api.projects.updateProjectStatus, {
        projectId,
        status: "processing",
      });
    });

    // Publish real-time event: transcription starting
    // Frontend receives this via useProjectRealtime hook
    await publish({
      channel: `project:${projectId}`, // Channel namespacing by project
      topic: REALTIME_TOPICS.TRANSCRIPTION_START,
      data: { message: "Starting transcription..." },
    });

    // Step 1: Transcribe audio with AssemblyAI (sequential - blocks next steps)
    // This step is durable: if it fails, Inngest retries automatically
    const transcript = await step.run("transcribe-audio", () =>
      transcribeWithAssemblyAI(fileUrl, projectId)
    );

    // Notify UI: transcription complete, generation starting
    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.TRANSCRIPTION_DONE,
      data: { message: "Transcription complete!" },
    });

    // Publish real-time event: AI generation starting
    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.GENERATION_START,
      data: { message: "Generating AI content (6 outputs)..." },
    });

    // Step 2: Run 6 AI generation tasks in parallel
    // Parallel Pattern: Promise.all executes all at once, waits for all to complete
    // Performance: ~60s total vs. ~300s sequential (5x faster)
    // Each function is wrapped in step.run() for durability and retries
    const [
      keyMoments,
      summary,
      socialPosts,
      titles,
      hashtags,
      youtubeTimestamps,
    ] = await Promise.all([
      generateKeyMoments(transcript),
      generateSummary(step, transcript),
      generateSocialPosts(step, transcript),
      generateTitles(step, transcript),
      generateHashtags(step, transcript),
      generateYouTubeTimestamps(step, transcript),
    ]);

    // Notify UI: all AI content generated
    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.GENERATION_DONE,
      data: { message: "All AI content generated!" },
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
  }
);
