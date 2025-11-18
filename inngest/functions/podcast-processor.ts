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
import { publishStepStart } from "../lib/realtime";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export const podcastProcessor = inngest.createFunction(
  { id: "podcast-processor" },
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

      await publishStepStart(
        publish,
        projectId,
        "",
        "Starting podcast processing...",
        0
      );
    });

    // =======================================================================
    // LINEAR PHASE: Transcription
    // =======================================================================

    const transcript = await step.run("transcribe-audio", () =>
      transcribeWithAssemblyAI(fileUrl, projectId, publish)
    );

    // =======================================================================
    // PARALLEL PHASE: AI Content Generation
    // =======================================================================

    const [
      keyMoments,
      summary,
      socialPosts,
      titles,
      hashtags,
      youtubeTimestamps,
    ] = await Promise.all([
      step.run("generate-key-moments", () =>
        generateKeyMoments(transcript, projectId, publish)
      ),
      step.run("generate-podcast-summary", () =>
        generateSummary(transcript, projectId, publish)
      ),
      step.run("generate-social-posts", () =>
        generateSocialPosts(transcript, projectId, publish)
      ),
      step.run("generate-titles", () =>
        generateTitles(transcript, projectId, publish)
      ),
      step.run("generate-hashtags", () =>
        generateHashtags(transcript, projectId, publish)
      ),
      step.run("generate-youtube-timestamps", () =>
        generateYouTubeTimestamps(transcript, projectId, publish)
      ),
    ]);

    // =======================================================================
    // JOIN PHASE: Save Results
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
