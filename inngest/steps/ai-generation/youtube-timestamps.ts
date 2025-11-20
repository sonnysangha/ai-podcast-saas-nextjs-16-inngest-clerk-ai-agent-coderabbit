/**
 * YouTube Timestamps Generation
 * 
 * Generates YouTube chapter timestamps with AI-enhanced descriptions.
 * YouTube chapters improve video navigation, watch time, and SEO.
 * 
 * Two-Step Process:
 * 1. Extract timing from AssemblyAI chapters (accurate timestamps)
 * 2. Use GPT to create punchy, clickable chapter titles
 * 
 * Why Hybrid Approach (AssemblyAI + GPT)?
 * - AssemblyAI: Accurate timing and topic detection
 * - GPT: Engaging, YouTube-optimized titles
 * - Result: Best of both - precise timing with compelling titles
 * 
 * YouTube Requirements:
 * - First timestamp must be 0:00
 * - Max 100 timestamps per video
 * - Format: "MM:SS Description" or "HH:MM:SS Description"
 * - Each chapter should have meaningful title
 * 
 * Use Cases:
 * - Paste directly into YouTube description
 * - Improves video SEO and watch time
 * - Enhances viewer navigation experience
 */
import type { step as InngestStep } from "inngest";
import type OpenAI from "openai";
import { formatTimestamp } from "@/lib/format";
import { openai } from "../../lib/openai-client";
import type { TranscriptWithExtras } from "../../types/assemblyai";

type YouTubeTimestamp = {
  timestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  description: string; // Chapter title
};

/**
 * Generates YouTube-ready timestamps with AI-enhanced titles
 * 
 * Process Flow:
 * 1. Extract chapters from AssemblyAI (timing + basic titles)
 * 2. Limit to 100 chapters (YouTube's max)
 * 3. Send to GPT for title enhancement
 * 4. Combine AI titles with original timestamps
 * 5. Format for YouTube compatibility
 * 
 * Error Handling:
 * - Throws if no chapters available (can't generate without timing)
 * - Falls back to AssemblyAI headlines if GPT fails
 * - Graceful degradation on JSON parse errors
 */
export async function generateYouTubeTimestamps(
  step: typeof InngestStep,
  transcript: TranscriptWithExtras,
): Promise<YouTubeTimestamp[]> {
  console.log(
    "Generating YouTube timestamps from AssemblyAI chapters with AI-enhanced titles",
  );

  // Use AssemblyAI chapters for accurate timing
  const chapters = transcript.chapters || [];

  // Validation: Timestamps require chapter timing data
  if (!chapters || chapters.length === 0) {
    throw new Error(
      "No chapters available from AssemblyAI. Cannot generate YouTube timestamps.",
    );
  }

  // YouTube limit: 100 timestamps maximum
  const chaptersToUse = chapters.slice(0, 100);

  console.log(`Using ${chaptersToUse.length} chapters from AssemblyAI`);

  // Prepare chapter data for GPT (timing + context)
  const chapterData = chaptersToUse.map((chapter, idx) => ({
    index: idx,
    timestamp: Math.floor(chapter.start / 1000), // Convert ms to seconds
    headline: chapter.headline, // AssemblyAI's auto-generated title
    summary: chapter.summary, // Chapter description for context
    gist: chapter.gist, // Brief summary
  }));

  // Prompt GPT to create YouTube-optimized chapter titles
  // Goal: More engaging than AssemblyAI's auto-generated headlines
  const prompt = `You are a YouTube content expert. I have ${
    chapterData.length
  } chapters from a podcast with their timestamps and descriptions. Your task is to create punchy, engaging, clickable 3-6 word titles for each chapter that will work as YouTube timestamps.

CHAPTERS:
${chapterData
  .map((ch) => `[${ch.timestamp}s] ${ch.headline} - ${ch.summary}`)
  .join("\n")}

TASK:
Create a YouTube-friendly title for each chapter that:
- Is 3-6 words long
- Is punchy and clickable
- Makes viewers want to click
- Captures the essence of that chapter
- Uses engaging language (e.g., "How to...", "The secret to...", "Why X matters", etc.)

Return a JSON object with a "titles" array where each item has:
- "index": the chapter index (0, 1, 2...)
- "title": the YouTube-friendly title

Example:
{
  "titles": [
    {"index": 0, "title": "Welcome and Intro"},
    {"index": 1, "title": "Building Financial Security"},
    {"index": 2, "title": "From Debt to Wealth"}
  ]
}`;

  // Bind OpenAI method to preserve `this` context for step.ai.wrap
  const createCompletion = openai.chat.completions.create.bind(
    openai.chat.completions,
  );

  // Call GPT to enhance chapter titles
  const response = (await step.ai.wrap(
    "generate-youtube-titles-with-gpt",
    createCompletion,
    {
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a YouTube content expert who creates engaging, clickable titles for video chapters. You make titles punchy and compelling while staying true to the content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 1500, // Enough for 100 titles
    },
  )) as OpenAI.Chat.Completions.ChatCompletion;

  const content = response.choices[0]?.message?.content || '{"titles":[]}';

  // Parse GPT's JSON response
  let aiTitles: { index: number; title: string }[] = [];
  try {
    const parsed = JSON.parse(content);
    aiTitles = parsed.titles || [];
  } catch (error) {
    // Fallback: Use original AssemblyAI headlines if GPT response is malformed
    console.error("Failed to parse AI titles, using original headlines", error);
  }

  // Combine AI-enhanced titles with AssemblyAI timing
  const aiTimestamps = chapterData.map((chapter) => {
    const aiTitle = aiTitles.find((t) => t.index === chapter.index);

    return {
      timestamp: chapter.timestamp,
      // Use AI title if available, fallback to AssemblyAI headline
      description: aiTitle?.title || chapter.headline,
    };
  });

  console.log(
    `Generated ${aiTimestamps.length} YouTube timestamps:`,
    aiTimestamps.slice(0, 3).map((t) => `${t.timestamp}s: ${t.description}`),
  );

  // Format timestamps in YouTube's required format (MM:SS or HH:MM:SS)
  const youtubeTimestamps = aiTimestamps.map((item) => ({
    timestamp: formatTimestamp(item.timestamp, { padHours: false }),
    description: item.description,
  }));

  console.log(`Generated ${youtubeTimestamps.length} YouTube timestamps`);

  return youtubeTimestamps;
}
