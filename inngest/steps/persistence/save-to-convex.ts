import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Summary } from "../../schemas/ai-outputs";
import type { Titles } from "../../schemas/ai-outputs";
import type { SocialPosts } from "../../schemas/ai-outputs";
import type { Hashtags } from "../../schemas/ai-outputs";
import { publishStepComplete, type PublishFunction } from "../../lib/realtime";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

type KeyMoment = {
  time: string;
  timestamp: number;
  text: string;
  description: string;
};

type YouTubeTimestamp = {
  timestamp: string;
  description: string;
};

type GeneratedContent = {
  keyMoments: KeyMoment[];
  summary: Summary;
  socialPosts: SocialPosts;
  titles: Titles;
  hashtags: Hashtags;
  youtubeTimestamps: YouTubeTimestamp[];
};

export async function saveResultsToConvex(
  projectId: Id<"projects">,
  results: GeneratedContent,
  publish: PublishFunction
): Promise<void> {
  await convex.mutation(api.projects.saveGeneratedContent, {
    projectId,
    keyMoments: results.keyMoments,
    summary: results.summary,
    socialPosts: results.socialPosts,
    titles: results.titles,
    hashtags: results.hashtags,
    youtubeTimestamps: results.youtubeTimestamps,
  });

  // Update project status to completed
  await convex.mutation(api.projects.updateProjectStatus, {
    projectId,
    status: "completed",
  });

  // Publish final completion
  await publishStepComplete(
    publish,
    projectId,
    "",
    "All processing completed!",
    100
  );

  console.log("Podcast processing completed for project:", projectId);
}
