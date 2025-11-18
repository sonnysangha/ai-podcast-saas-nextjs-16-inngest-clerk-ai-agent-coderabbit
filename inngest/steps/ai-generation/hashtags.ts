import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { TranscriptWithExtras } from "../../types/assemblyai";
import { hashtagsSchema, type Hashtags } from "../../schemas/ai-outputs";
import { openai } from "../../lib/openai-client";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  publishStepStart,
  publishStepComplete,
  publishResult,
  type PublishFunction,
} from "../../lib/realtime";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

const HASHTAGS_SYSTEM_PROMPT =
  "You are a social media growth expert who understands platform algorithms and trending hashtag strategies. You create hashtag sets that maximize reach and engagement.";

function buildHashtagsPrompt(transcript: TranscriptWithExtras): string {
  return `Create platform-optimized hashtag strategies for this podcast.

TOPICS COVERED:
${
  transcript.chapters
    ?.map((ch, idx) => `${idx + 1}. ${ch.headline}`)
    .join("\n") || "General discussion"
}

Generate hashtags for each platform following their best practices:

1. YOUTUBE (exactly 5 hashtags):
   - Broad reach, discovery-focused
   - Mix of general and niche
   - Trending in podcast/content space
   - Good for recommendations algorithm

2. INSTAGRAM (6-8 hashtags):
   - Mix of highly popular (100k+ posts) and niche (10k-50k posts)
   - Community-building tags
   - Content discovery tags
   - Trending but relevant

3. TIKTOK (5-6 hashtags):
   - Currently trending tags
   - Gen Z relevant
   - FYP optimization
   - Mix viral and niche

4. LINKEDIN (exactly 5 hashtags):
   - Professional, B2B focused
   - Industry-relevant
   - Thought leadership tags
   - Career/business oriented

5. TWITTER (exactly 5 hashtags):
   - Concise, trending
   - Topic-specific
   - Conversation-starting
   - Mix broad and niche

All hashtags should include the # symbol and be relevant to the actual content discussed.`;
}

export async function generateHashtags(
  transcript: TranscriptWithExtras,
  projectId: Id<"projects">,
  publish: PublishFunction
): Promise<Hashtags> {
  await convex.mutation(api.projects.updateJobStatus, {
    projectId,
    job: "hashtags",
    status: "running",
  });

  await publishStepStart(
    publish,
    projectId,
    "hashtags",
    "Generating smart hashtags...",
    90
  );

  console.log("Generating hashtags with GPT");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: HASHTAGS_SYSTEM_PROMPT },
        { role: "user", content: buildHashtagsPrompt(transcript) },
      ],
      response_format: zodResponseFormat(hashtagsSchema, "hashtags"),
    });

    const content = completion.choices[0]?.message?.content;
    const hashtags = content
      ? hashtagsSchema.parse(JSON.parse(content))
      : {
          youtube: ["#Podcast"],
          instagram: ["#Podcast", "#Content"],
          tiktok: ["#Podcast"],
          linkedin: ["#Podcast"],
          twitter: ["#Podcast"],
        };

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "hashtags",
      status: "completed",
    });

    await publishResult(publish, projectId, "hashtags", hashtags);

    return hashtags;
  } catch (error) {
    console.error("GPT hashtags error:", error);

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "hashtags",
      status: "failed",
    });

    return {
      youtube: ["⚠️ Hashtag generation failed"],
      instagram: ["⚠️ Hashtag generation failed"],
      tiktok: ["⚠️ Hashtag generation failed"],
      linkedin: ["⚠️ Hashtag generation failed"],
      twitter: ["⚠️ Hashtag generation failed"],
    };
  }
}

