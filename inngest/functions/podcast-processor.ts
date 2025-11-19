import { inngest } from "@/inngest/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { transcribeWithAssemblyAI } from "../steps/transcription/assemblyai";
import { generateKeyMoments } from "../steps/ai-generation/key-moments";
import { generateSummary } from "../steps/ai-generation/summary";
import { generateSocialPosts } from "../steps/ai-generation/social-posts";
import { generateTitles } from "../steps/ai-generation/titles";
import { generateHashtags } from "../steps/ai-generation/hashtags";
import { generateYouTubeTimestamps } from "../steps/ai-generation/youtube-timestamps";
import { saveResultsToConvex } from "../steps/persistence/save-to-convex";
import { REALTIME_TOPICS } from "../lib/realtime-topics";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export const podcastProcessor = inngest.createFunction(
  {
    id: "podcast-processor",
    optimizeParallelism: true, // Optimize parallel AI generation steps
  },
  { event: "podcast/uploaded" },
  async ({ event, step, publish }) => {
    const { projectId, fileUrl } = event.data;

    // =======================================================================
    // INITIALIZATION
    // =======================================================================

    await step.run("update-status-processing", async () => {
      await convex.mutation(api.projects.updateProjectStatus, {
        projectId,
        status: "processing",
      });
    });

    // =======================================================================
    // PHASE 1: Transcription
    // =======================================================================

    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.TRANSCRIPTION_START,
      data: { message: "Starting transcription..." },
    });

    const transcript = await step.run("transcribe-audio", () =>
      transcribeWithAssemblyAI(fileUrl, projectId, publish)
    );

    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.TRANSCRIPTION_DONE,
      data: { message: "Transcription complete!" },
    });

    // =======================================================================
    // PHASE 2: AI Content Generation (6 outputs in parallel)
    // =======================================================================

    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.GENERATION_START,
      data: { message: "Generating AI content (6 outputs)..." },
    });

    const [
      keyMoments,
      summary,
      socialPosts,
      titles,
      hashtags,
      youtubeTimestamps,
    ] = await Promise.all([
      generateKeyMoments(step, transcript),
      generateSummary(step, transcript),
      generateSocialPosts(step, transcript),
      generateTitles(step, transcript),
      generateHashtags(step, transcript),
      generateYouTubeTimestamps(step, transcript),
    ]);

    await publish({
      channel: `project:${projectId}`,
      topic: REALTIME_TOPICS.GENERATION_DONE,
      data: { message: "All AI content generated!" },
    });

    // =======================================================================
    // SAVE RESULTS
    // =======================================================================

    await step.run("save-results-to-convex", () =>
      saveResultsToConvex(
        projectId,
        {
          keyMoments,
          summary,
          socialPosts,
          titles,
          hashtags,
          youtubeTimestamps,
        },
        publish
      )
    );

    return { success: true, projectId };
  }
);
