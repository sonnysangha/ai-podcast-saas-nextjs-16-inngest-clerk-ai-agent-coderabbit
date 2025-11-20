/**
 * Platform-Optimized Social Media Posts Generation
 * 
 * Generates 6 unique social media posts, each tailored to a specific platform's:
 * - Character limits and formatting conventions
 * - Audience demographics and tone expectations
 * - Engagement patterns and best practices
 * - Algorithm preferences
 * 
 * Platforms Covered:
 * - Twitter/X: 280 chars, punchy and quotable
 * - LinkedIn: Professional, thought-leadership
 * - Instagram: Visual storytelling, emoji-rich
 * - TikTok: Gen Z voice, trend-aware
 * - YouTube: Detailed descriptions with keywords
 * - Facebook: Community-focused, shareable
 * 
 * Prompt Engineering:
 * - Provides chapter summaries (context without full transcript)
 * - Strict character limits enforced in prompt
 * - Platform-specific guidelines and examples
 * - Safety validation for Twitter's 280-char limit
 */
import type { step as InngestStep } from "inngest";
import type OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "../../lib/openai-client";
import { type SocialPosts, socialPostsSchema } from "../../schemas/ai-outputs";
import type { TranscriptWithExtras } from "../../types/assemblyai";

// System prompt establishes GPT's expertise in platform-specific marketing
const SOCIAL_SYSTEM_PROMPT =
  "You are a viral social media marketing expert who understands each platform's unique audience, tone, and best practices. You create platform-optimized content that drives engagement and grows audiences.";

/**
 * Builds prompt with episode context and platform-specific guidelines
 * 
 * Prompt Structure:
 * - Episode summary from first chapter (context)
 * - Key topics from all chapters (content outline)
 * - Detailed platform requirements (formatting, tone, best practices)
 * 
 * Design Decision: Why 6 separate posts vs. one generic post?
 * - Each platform has unique audience expectations
 * - Cross-posting generic content performs poorly
 * - Platform algorithms favor native content styles
 * - Better engagement = better ROI for content creators
 */
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

/**
 * Generates platform-optimized social posts using OpenAI
 * 
 * Error Handling:
 * - Returns placeholder posts on failure (graceful degradation)
 * - Safety check: Truncates Twitter post if it exceeds 280 chars
 * - Logs errors for debugging
 * 
 * Validation:
 * - Zod schema enforces structure
 * - Twitter max length enforced in schema and post-validation
 * - Post-generation safety check catches edge cases
 */
export async function generateSocialPosts(
  step: typeof InngestStep,
  transcript: TranscriptWithExtras
): Promise<SocialPosts> {
  console.log("Generating social posts with GPT-4");

  try {
    // Bind OpenAI method to preserve `this` context for step.ai.wrap
    const createCompletion = openai.chat.completions.create.bind(
      openai.chat.completions
    );

    // Call OpenAI with Structured Outputs for type-safe, validated response
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
    const socialPosts = content
      ? socialPostsSchema.parse(JSON.parse(content))
      : {
          // Fallback posts if parsing fails
          twitter: "New podcast episode!",
          linkedin: "Check out our latest podcast.",
          instagram: "New episode out now! 🎙️",
          tiktok: "New podcast!",
          youtube: "Watch our latest episode.",
          facebook: "New podcast available!",
        };

    // Safety check: Enforce Twitter's 280-character limit
    // GPT sometimes exceeds despite prompt instructions
    if (socialPosts.twitter.length > 280) {
      console.warn(
        `Twitter post exceeded 280 chars (${socialPosts.twitter.length}), truncating...`
      );
      socialPosts.twitter = `${socialPosts.twitter.substring(0, 277)}...`;
    }

    return socialPosts;
  } catch (error) {
    console.error("GPT social posts error:", error);

    // Graceful degradation: Return error messages but allow workflow to continue
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
