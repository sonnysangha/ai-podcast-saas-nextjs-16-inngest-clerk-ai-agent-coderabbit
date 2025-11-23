/**
 * Retry Job Function - Retries Individual Failed Generation Steps
 *
 * Triggered when user clicks retry button on a failed tab.
 * Regenerates just that specific output without reprocessing everything.
 * Supports upgrade scenarios - if user upgraded, can generate newly-unlocked features.
 */
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex-client";
import type { PlanName } from "@/lib/tier-config";
import { FEATURES } from "@/lib/tier-config";
import { planHasFeature } from "@/lib/tier-utils";
import { inngest } from "../client";
import { generateHashtags } from "../steps/ai-generation/hashtags";
import { generateKeyMoments } from "../steps/ai-generation/key-moments";
import { generateSocialPosts } from "../steps/ai-generation/social-posts";
import { generateSummary } from "../steps/ai-generation/summary";
import { generateTitles } from "../steps/ai-generation/titles";
import { generateYouTubeTimestamps } from "../steps/ai-generation/youtube-timestamps";
import type { TranscriptWithExtras } from "../types/assemblyai";

export const retryJobFunction = inngest.createFunction(
  { id: "retry-job" },
  { event: "podcast/retry-job" },
  async ({ event, step }) => {
    const { projectId, job, originalPlan, currentPlan } = event.data;

    // Check if user has upgraded and now has access to this feature
    const currentUserPlan = (currentPlan as PlanName) || "free";
    const originalUserPlan = (originalPlan as PlanName) || "free";

    // Map job names to feature keys
    const jobToFeature: Record<string, string> = {
      socialPosts: FEATURES.SOCIAL_POSTS,
      titles: FEATURES.TITLES,
      hashtags: FEATURES.HASHTAGS,
      keyMoments: FEATURES.KEY_MOMENTS,
      youtubeTimestamps: FEATURES.YOUTUBE_TIMESTAMPS,
    };

    // Check if user has access to this feature with current plan
    const featureKey = jobToFeature[job];
    if (featureKey && !planHasFeature(currentUserPlan, featureKey as any)) {
      throw new Error(
        `This feature (${job}) is not available on your current plan. Please upgrade to access it.`
      );
    }

    // Log if this is an upgrade scenario
    if (originalUserPlan !== currentUserPlan) {
      console.log(
        `User upgraded from ${originalUserPlan} to ${currentUserPlan}. Generating ${job}.`
      );
    }

    // Get project to access transcript
    const project = await convex.query(api.projects.getProject, { projectId });
    if (!project?.transcript) {
      throw new Error("Project or transcript not found");
    }

    // Validate we have the complete transcript data needed for generation
    const transcript = project.transcript as TranscriptWithExtras;

    // Basic validation: All jobs need transcript text
    if (!transcript.text || transcript.text.length === 0) {
      throw new Error(
        "Cannot generate content: transcript text is empty. Please re-upload the file."
      );
    }

    // Job-specific validation for jobs that require chapters
    const jobsRequiringChapters = ["keyMoments", "youtubeTimestamps"];
    if (jobsRequiringChapters.includes(job)) {
      if (!transcript.chapters || transcript.chapters.length === 0) {
        throw new Error(
          `Cannot generate ${job}: transcript has no chapters. This podcast may be too short or lack distinct topics for chapter detection.`
        );
      }
    }

    // Other jobs (summary, socialPosts, titles, hashtags) can work with just text
    // They will use chapters if available for better context, but don't require them

    // Regenerate the specific job
    try {
      switch (job) {
        case "keyMoments": {
          const result = await generateKeyMoments(transcript);
          await step.run("save-key-moments", () =>
            convex.mutation(api.projects.saveGeneratedContent, {
              projectId,
              keyMoments: result,
            })
          );
          break;
        }

        case "summary": {
          const result = await generateSummary(step, transcript);
          await step.run("save-summary", () =>
            convex.mutation(api.projects.saveGeneratedContent, {
              projectId,
              summary: result,
            })
          );
          break;
        }

        case "socialPosts": {
          const result = await generateSocialPosts(step, transcript);
          await step.run("save-social-posts", () =>
            convex.mutation(api.projects.saveGeneratedContent, {
              projectId,
              socialPosts: result,
            })
          );
          break;
        }

        case "titles": {
          const result = await generateTitles(step, transcript);
          await step.run("save-titles", () =>
            convex.mutation(api.projects.saveGeneratedContent, {
              projectId,
              titles: result,
            })
          );
          break;
        }

        case "hashtags": {
          const result = await generateHashtags(step, transcript);
          await step.run("save-hashtags", () =>
            convex.mutation(api.projects.saveGeneratedContent, {
              projectId,
              hashtags: result,
            })
          );
          break;
        }

        case "youtubeTimestamps": {
          const result = await generateYouTubeTimestamps(step, transcript);
          await step.run("save-youtube-timestamps", () =>
            convex.mutation(api.projects.saveGeneratedContent, {
              projectId,
              youtubeTimestamps: result,
            })
          );
          break;
        }
      }

      // Clear the error for this job after successful completion
      await step.run("clear-job-error", async () => {
        const currentErrors = project.jobErrors || {};
        const updatedErrors = { ...currentErrors };
        delete updatedErrors[job as keyof typeof updatedErrors];

        await convex.mutation(api.projects.saveJobErrors, {
          projectId,
          jobErrors: updatedErrors,
        });
      });

      return { success: true, job };
    } catch (error) {
      // Save the error back to Convex
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await convex.mutation(api.projects.saveJobErrors, {
        projectId,
        jobErrors: {
          [job]: errorMessage,
        },
      });

      throw error;
    }
  }
);
