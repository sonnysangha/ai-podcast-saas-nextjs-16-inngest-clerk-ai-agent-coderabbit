import type { TranscriptWithExtras } from "../../types/assemblyai";
import { titlesSchema, type Titles } from "../../schemas/ai-outputs";
import { zodResponseFormat } from "openai/helpers/zod";
import type { step as InngestStep } from "inngest";
import { openai } from "../../lib/openai-client";
import type OpenAI from "openai";

const TITLES_SYSTEM_PROMPT =
  "You are an expert in SEO, content marketing, and viral content creation. You understand what makes titles clickable while maintaining credibility and search rankings.";

function buildTitlesPrompt(transcript: TranscriptWithExtras): string {
  return `Create optimized titles for this podcast episode.

TRANSCRIPT PREVIEW:
${transcript.text.substring(0, 2000)}...

${
  transcript.chapters.length > 0
    ? `MAIN TOPICS COVERED:\n${transcript.chapters
        .map((ch, idx) => `${idx + 1}. ${ch.headline}`)
        .join("\n")}`
    : ""
}

Generate 4 types of titles:

1. YOUTUBE SHORT TITLES (exactly 3):
   - 40-60 characters each
   - Hook-focused, curiosity-driven
   - Clickable but not clickbait
   - Use power words and numbers when relevant

2. YOUTUBE LONG TITLES (exactly 3):
   - 70-100 characters each
   - Include SEO keywords naturally
   - Descriptive and informative
   - Format: "Main Topic: Subtitle | Context or Value Prop"

3. PODCAST EPISODE TITLES (exactly 3):
   - Creative, memorable titles
   - Balance intrigue with clarity
   - Good for RSS feeds and directories
   - Can use "Episode #" format or standalone

4. SEO KEYWORDS (5-10):
   - High-traffic search terms
   - Relevant to podcast content
   - Mix of broad and niche terms
   - Focus on what people actually search for

Make titles compelling, accurate, and optimized for discovery.`;
}

export async function generateTitles(
  step: typeof InngestStep,
  transcript: TranscriptWithExtras
): Promise<Titles> {
  console.log("Generating title suggestions with GPT-4");

  try {
    // Bind OpenAI method to preserve client context (required per Inngest docs)
    const createCompletion = openai.chat.completions.create.bind(
      openai.chat.completions
    );

    const response = (await step.ai.wrap(
      "generate-titles-with-gpt",
      createCompletion,
      {
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: TITLES_SYSTEM_PROMPT },
          { role: "user", content: buildTitlesPrompt(transcript) },
        ],
        response_format: zodResponseFormat(titlesSchema, "titles"),
      }
    )) as OpenAI.Chat.Completions.ChatCompletion;

    const titlesContent = response.choices[0]?.message?.content;
    const titles = titlesContent
      ? titlesSchema.parse(JSON.parse(titlesContent))
      : {
          youtubeShort: ["Podcast Episode"],
          youtubeLong: ["Podcast Episode - Full Discussion"],
          podcastTitles: ["New Episode"],
          seoKeywords: ["podcast"],
        };

    return titles;
  } catch (error) {
    console.error("GPT titles error:", error);

    return {
      youtubeShort: ["⚠️ Title generation failed"],
      youtubeLong: ["⚠️ Title generation failed - check logs"],
      podcastTitles: ["⚠️ Title generation failed"],
      seoKeywords: ["error"],
    };
  }
}
