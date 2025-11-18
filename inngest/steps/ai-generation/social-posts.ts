import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { TranscriptWithExtras } from "../../types/assemblyai";
import { socialPostsSchema, type SocialPosts } from "../../schemas/ai-outputs";
import { openai } from "../../lib/openai-client";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  publishStepStart,
  publishStepComplete,
  publishResult,
  type PublishFunction,
} from "../../lib/realtime";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

const SOCIAL_SYSTEM_PROMPT =
  "You are a viral social media marketing expert who understands each platform's unique audience, tone, and best practices. You create platform-optimized content that drives engagement and grows audiences.";

function buildSocialPrompt(transcript: TranscriptWithExtras): string {
  return `Create platform-specific promotional posts for this podcast episode.

PODCAST SUMMARY:
${transcript.chapters?.[0]?.summary || transcript.text.substring(0, 500)}

KEY TOPICS DISCUSSED:
${
  transcript.chapters
    ?.slice(0, 5)
    .map((ch, idx) => `${idx + 1}. ${ch.headline}`)
    .join("\n") || "See transcript"
}

Create 6 unique posts optimized for each platform:

1. TWITTER/X (max 280 characters):
   - Start with a hook that stops scrolling
   - Include the main value proposition or insight
   - Make it thread-worthy
   - Conversational, punchy tone
   - Can include emojis but use sparingly

2. LINKEDIN (1-2 paragraphs):
   - Professional, thought-leadership tone
   - Lead with an insight, question, or stat
   - Provide business/career value
   - End with an engagement question or CTA
   - Avoid excessive emojis

3. INSTAGRAM (caption):
   - Engaging storytelling approach
   - Use emojis strategically (2-4 max)
   - Build community connection
   - Include call-to-action
   - Personal and relatable

4. TIKTOK (short caption):
   - Gen Z friendly, energetic tone
   - Use trending language/slang
   - Very concise and punchy
   - Create FOMO or curiosity
   - Emojis welcome

5. YOUTUBE (detailed description):
   - SEO-friendly, keyword-rich
   - Explain what viewers will learn
   - Professional but engaging
   - Include episode highlights
   - Can be longer (2-3 paragraphs)

6. FACEBOOK (2-3 paragraphs):
   - Conversational, relatable tone
   - Shareable content approach
   - Community-focused
   - End with question or discussion prompt
   - Mix of personal and informative

Make each post unique and truly optimized for that platform. No generic content.`;
}

export async function generateSocialPosts(
  transcript: TranscriptWithExtras,
  projectId: Id<"projects">,
  publish: PublishFunction
): Promise<SocialPosts> {
  await convex.mutation(api.projects.updateJobStatus, {
    projectId,
    job: "social",
    status: "running",
  });

  await publishStepStart(
    publish,
    projectId,
    "social",
    "Generating platform-specific social posts...",
    60
  );

  console.log("Generating social posts with GPT-4");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SOCIAL_SYSTEM_PROMPT },
        { role: "user", content: buildSocialPrompt(transcript) },
      ],
      response_format: zodResponseFormat(socialPostsSchema, "social_posts"),
    });

    const content = completion.choices[0]?.message?.content;
    const socialPosts = content
      ? socialPostsSchema.parse(JSON.parse(content))
      : {
          twitter: "New podcast episode!",
          linkedin: "Check out our latest podcast.",
          instagram: "New episode out now! 🎙️",
          tiktok: "New podcast!",
          youtube: "Watch our latest episode.",
          facebook: "New podcast available!",
        };

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "social",
      status: "completed",
    });

    await publishResult(publish, projectId, "social", socialPosts);

    return socialPosts;
  } catch (error) {
    console.error("GPT social posts error:", error);

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "social",
      status: "failed",
    });

    return {
      twitter: "⚠️ Error generating social post. Check logs for details.",
      linkedin: "⚠️ Error generating social post. Check logs for details.",
      instagram: "⚠️ Error generating social post. Check logs for details.",
      tiktok: "⚠️ Error generating social post. Check logs for details.",
      youtube: "⚠️ Error generating social post. Check logs for details.",
      facebook: "⚠️ Error generating social post. Check logs for details.",
    };
  }
}

