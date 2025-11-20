/**
 * Platform-Specific Hashtag Generation
 * 
 * Generates optimized hashtag strategies for 5 social platforms.
 * Each platform has different hashtag best practices and algorithms.
 * 
 * Platform Strategies:
 * - YouTube: 5 hashtags, broad reach, discovery-focused
 * - Instagram: 6-8 hashtags, mix of niche + broad (sweet spot for engagement)
 * - TikTok: 5-6 hashtags, trending tags for FYP algorithm
 * - LinkedIn: 5 hashtags, professional/industry-specific
 * - Twitter: 5 hashtags, concise and conversation-starting
 * 
 * Why Platform-Specific?
 * - Each platform's algorithm treats hashtags differently
 * - Instagram rewards 6-8 hashtags, Twitter prefers 1-2
 * - TikTok prioritizes trending tags, LinkedIn values professional keywords
 * - Using wrong strategy can reduce reach and engagement
 */
import type { step as InngestStep } from "inngest";
import type OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "../../lib/openai-client";
import { type Hashtags, hashtagsSchema } from "../../schemas/ai-outputs";
import type { TranscriptWithExtras } from "../../types/assemblyai";

// System prompt establishes GPT's knowledge of hashtag strategies
const HASHTAGS_SYSTEM_PROMPT =
  "You are a social media growth expert who understands platform algorithms and trending hashtag strategies. You create hashtag sets that maximize reach and engagement.";

/**
 * Builds prompt with episode topics and platform-specific guidelines
 * 
 * Context Provided:
 * - Chapter headlines (topic extraction)
 * - Platform-specific hashtag counts and strategies
 * - Best practices for each platform's algorithm
 * 
 * Prompt Engineering:
 * - Exact counts specified (5 for most, 6-8 for Instagram)
 * - Platform algorithm considerations explained
 * - Mix of trending, niche, and broad tags
 */
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

/**
 * Generates hashtag sets using OpenAI with structured outputs
 * 
 * Error Handling:
 * - Returns placeholder hashtags on failure
 * - Logs errors for debugging
 * - Graceful degradation (workflow continues)
 * 
 * Validation:
 * - Zod schema enforces exact counts per platform
 * - Instagram validated for 6-8 range (optimal engagement)
 * - All hashtags should include # symbol
 */
export async function generateHashtags(
  step: typeof InngestStep,
  transcript: TranscriptWithExtras,
): Promise<Hashtags> {
  console.log("Generating hashtags with GPT");

  try {
    // Bind OpenAI method to preserve `this` context for step.ai.wrap
    const createCompletion = openai.chat.completions.create.bind(
      openai.chat.completions,
    );

    // Call OpenAI with Structured Outputs for validated response
    const response = (await step.ai.wrap(
      "generate-hashtags-with-gpt",
      createCompletion,
      {
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: HASHTAGS_SYSTEM_PROMPT },
          { role: "user", content: buildHashtagsPrompt(transcript) },
        ],
        response_format: zodResponseFormat(hashtagsSchema, "hashtags"),
      },
    )) as OpenAI.Chat.Completions.ChatCompletion;

    const content = response.choices[0]?.message?.content;
    // Parse and validate against schema
    const hashtags = content
      ? hashtagsSchema.parse(JSON.parse(content))
      : {
          // Fallback hashtags if parsing fails
          youtube: ["#Podcast"],
          instagram: ["#Podcast", "#Content"],
          tiktok: ["#Podcast"],
          linkedin: ["#Podcast"],
          twitter: ["#Podcast"],
        };

    return hashtags;
  } catch (error) {
    console.error("GPT hashtags error:", error);

    // Graceful degradation: Return error indicators
    return {
      youtube: ["⚠️ Hashtag generation failed"],
      instagram: ["⚠️ Hashtag generation failed"],
      tiktok: ["⚠️ Hashtag generation failed"],
      linkedin: ["⚠️ Hashtag generation failed"],
      twitter: ["⚠️ Hashtag generation failed"],
    };
  }
}
