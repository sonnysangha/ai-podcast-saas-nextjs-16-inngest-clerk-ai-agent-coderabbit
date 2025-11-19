import type { TranscriptWithExtras } from "../../types/assemblyai";
import { socialPostsSchema, type SocialPosts } from "../../schemas/ai-outputs";
import { zodResponseFormat } from "openai/helpers/zod";
import type { step as InngestStep } from "inngest";
import { openai } from "../../lib/openai-client";
import type OpenAI from "openai";

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

1. TWITTER/X (MAXIMUM 280 characters - STRICT LIMIT):
   - Start with a hook that stops scrolling
   - Include the main value proposition or insight
   - Make it thread-worthy
   - Conversational, punchy tone
   - Can include emojis but use sparingly
   - **CRITICAL: Must be 280 characters or less, including spaces and emojis**

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
  step: typeof InngestStep,
  transcript: TranscriptWithExtras
): Promise<SocialPosts> {
  console.log("Generating social posts with GPT-4");

  try {
    // Bind OpenAI method to preserve client context (required per Inngest docs)
    const createCompletion = openai.chat.completions.create.bind(
      openai.chat.completions
    );

    const response = (await step.ai.wrap(
      "generate-social-posts-with-gpt",
      createCompletion,
      {
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: SOCIAL_SYSTEM_PROMPT },
          { role: "user", content: buildSocialPrompt(transcript) },
        ],
        response_format: zodResponseFormat(socialPostsSchema, "social_posts"),
      }
    )) as OpenAI.Chat.Completions.ChatCompletion;

    const content = response.choices[0]?.message?.content;
    let socialPosts = content
      ? socialPostsSchema.parse(JSON.parse(content))
      : {
          twitter: "New podcast episode!",
          linkedin: "Check out our latest podcast.",
          instagram: "New episode out now! 🎙️",
          tiktok: "New podcast!",
          youtube: "Watch our latest episode.",
          facebook: "New podcast available!",
        };

    // Safety check: Truncate Twitter post if it somehow exceeds 280 chars
    if (socialPosts.twitter.length > 280) {
      console.warn(
        `Twitter post exceeded 280 chars (${socialPosts.twitter.length}), truncating...`
      );
      socialPosts.twitter = socialPosts.twitter.substring(0, 277) + "...";
    }

    return socialPosts;
  } catch (error) {
    console.error("GPT social posts error:", error);

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
