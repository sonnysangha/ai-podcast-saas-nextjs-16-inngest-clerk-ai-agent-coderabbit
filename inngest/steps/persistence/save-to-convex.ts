/**
 * Save Results to Convex - Final Persistence Step
 *
 * This function is called at the end of the Inngest workflow to persist all
 * AI-generated content to Convex in a single atomic operation.
 *
 * Workflow Context:
 * - Called after 6 parallel AI generation jobs complete
 * - Receives all generated content as a single object
 * - Saves everything in one Convex mutation (atomic update)
 * - Marks project as "completed" to trigger UI state change
 *
 * Design Decision: Single mutation vs. multiple mutations
 * - Pro: Atomic - all content appears together (no partial states in UI)
 * - Pro: One database transaction = faster and more reliable
 * - Pro: Simpler error handling (all or nothing)
 * - Con: Slight delay before UI updates (waits for all jobs)
 * - Trade-off: Better UX consistency over incremental updates
 *
 * Real-time Flow:
 * 1. This mutation updates Convex
 * 2. Convex broadcasts update to all subscribers
 * 3. React components (useQuery) automatically re-render
 * 4. UI shows all new content immediately
 */
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import type {
  Hashtags,
  SocialPosts,
  Summary,
  Titles,
} from "../../schemas/ai-outputs";

type KeyMoment = {
  time: string; // Human-readable timestamp
  timestamp: number; // Seconds
  text: string; // Moment title
  description: string; // Moment description
};

type YouTubeTimestamp = {
  timestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  description: string; // Chapter title
};

/**
 * Aggregated results from all parallel AI generation steps
 * All fields are optional since individual steps can fail without blocking others
 */
type GeneratedContent = {
  keyMoments?: KeyMoment[];
  summary?: Summary;
  socialPosts?: SocialPosts;
  titles?: Titles;
  hashtags?: Hashtags;
  youtubeTimestamps?: YouTubeTimestamp[];
};

/**
 * Saves all AI-generated content to Convex and marks project as complete
 *
 * Handles partial results: If some generation steps failed, we still save
 * whatever succeeded. This is better UX than failing the entire workflow.
 *
 * Two-Step Process:
 * 1. Save all generated content (atomic update, optional fields allowed)
 * 2. Update project status to "completed"
 *
 * Why two separate mutations?
 * - saveGeneratedContent handles optional fields (some may be missing on error)
 * - updateProjectStatus is a separate concern (status management)
 * - Easier to track which step failed if error occurs
 *
 * @param projectId - Convex project ID
 * @param results - All generated content from parallel AI jobs (some may be undefined)
 */
export async function saveResultsToConvex(
  projectId: Id<"projects">,
  results: GeneratedContent
): Promise<void> {
  // Save all AI-generated content in one atomic operation
  // This mutation updates the project document with all new fields
  await convex.mutation(api.projects.saveGeneratedContent, {
    projectId,
    keyMoments: results.keyMoments,
    summary: results.summary,
    socialPosts: results.socialPosts,
    titles: results.titles,
    hashtags: results.hashtags,
    youtubeTimestamps: results.youtubeTimestamps,
  });

  // Mark project as completed
  // This triggers UI state change: "Processing..." -> "Completed"
  await convex.mutation(api.projects.updateProjectStatus, {
    projectId,
    status: "completed",
  });

  console.log("Podcast processing completed for project:", projectId);
}
