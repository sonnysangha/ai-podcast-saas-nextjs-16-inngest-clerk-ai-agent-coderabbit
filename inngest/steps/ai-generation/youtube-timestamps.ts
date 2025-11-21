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
  transcript: TranscriptWithExtras
): Promise<YouTubeTimestamp[]> {
  console.log(
    "Generating YouTube timestamps from AssemblyAI chapters with AI-enhanced titles"
  );

  // Use AssemblyAI chapters for accurate timing
  const chapters = transcript.chapters || [];

  // Validation: Timestamps require chapter timing data
  if (!chapters || chapters.length === 0) {
    throw new Error(
      "No chapters available from AssemblyAI. Cannot generate YouTube timestamps."
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
  const prompt = `You are a YouTube content optimization expert. Create SHORT CHAPTER TITLES for a video.

CRITICAL INSTRUCTIONS:
- DO NOT copy the transcript text
- DO NOT write full sentences
- Create 3-6 word TITLES only
- Think of these as chapter headings, not subtitles

I have ${
    chapterData.length
  } chapters with timestamps. For each one, create a SHORT, CATCHY TITLE.

CHAPTERS:
${chapterData
  .map(
    (ch, idx) =>
      `Chapter ${idx}: [${ch.timestamp}s]\nContext: ${ch.headline}\nSummary: ${ch.summary}`
  )
  .join("\n\n")}

YOUR TASK:
Transform each chapter into a 3-6 word YouTube chapter title.

EXAMPLES OF GOOD TITLES:
✓ "Introduction to N8N Automation" (5 words, descriptive title)
✓ "Setting Up Your Account" (4 words, action-oriented)
✓ "Telegram Bot Creation" (3 words, clear and concise)
✓ "Building Multi-Agent Workflows" (3 words, technical but clear)
✓ "Testing the News Agent" (4 words, specific feature)

EXAMPLES OF BAD RESPONSES (DO NOT DO THIS):
✗ "Today we are diving into n8n one of the most underrated" (transcript excerpt)
✗ "One click setup with n8n com allows you to get" (full sentence from transcript)
✗ "So we want to give Sarah some instructions so she knows" (conversational transcript)

Return ONLY valid JSON in this exact format:
{
  "titles": [
    {"index": 0, "title": "Introduction to N8N Automation"},
    {"index": 1, "title": "Setting Up Your Account"},
    {"index": 2, "title": "Building Your First Bot"}
  ]
}

Remember: Create TITLES, not transcript excerpts!`;

  // Bind OpenAI method to preserve `this` context for step.ai.wrap
  const createCompletion = openai.chat.completions.create.bind(
    openai.chat.completions
  );

  // Call GPT to enhance chapter titles
  const response = (await step.ai.wrap(
    "generate-youtube-titles-with-gpt",
    createCompletion,
    {
      model: "gpt-5-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "youtube_chapter_titles",
          strict: true,
          schema: {
            type: "object",
            properties: {
              titles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: {
                      type: "number",
                      description: "Chapter index",
                    },
                    title: {
                      type: "string",
                      description: "Short, catchy chapter title (3-6 words)",
                    },
                  },
                  required: ["index", "title"],
                  additionalProperties: false,
                },
              },
            },
            required: ["titles"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a YouTube content expert who creates SHORT, DESCRIPTIVE TITLES for video chapters. CRITICAL: You create TITLES (like 'Introduction to AI'), NOT transcript text or full sentences. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 1500, // Enough for 100 titles
    }
  )) as OpenAI.Chat.Completions.ChatCompletion;

  const content = response.choices[0]?.message?.content || '{"titles":[]}';

  console.log("Raw GPT response:", content.substring(0, 500));

  // Parse GPT's JSON response
  let aiTitles: { index: number; title: string }[] = [];
  try {
    const parsed = JSON.parse(content);
    aiTitles = parsed.titles || [];
    console.log(`Successfully parsed ${aiTitles.length} AI-generated titles`);
    if (aiTitles.length > 0) {
      console.log("First 3 AI titles:", aiTitles.slice(0, 3));
    }
  } catch (error) {
    // Fallback: Use original AssemblyAI headlines if GPT response is malformed
    console.error("Failed to parse AI titles, using original headlines", error);
    console.error("Attempted to parse:", content);
  }

  // Combine AI-enhanced titles with AssemblyAI timing
  const aiTimestamps = chapterData.map((chapter) => {
    const aiTitle = aiTitles.find((t) => t.index === chapter.index);

    // Check if we're using fallback
    if (!aiTitle) {
      console.warn(
        `No AI title found for chapter ${chapter.index}, using fallback: "${chapter.headline}"`
      );
    }

    return {
      timestamp: chapter.timestamp,
      // Use AI title if available, fallback to AssemblyAI headline
      description: aiTitle?.title || chapter.headline,
    };
  });

  console.log(
    `Generated ${aiTimestamps.length} YouTube timestamps (first 3):`,
    aiTimestamps.slice(0, 3).map((t) => `${t.timestamp}s: ${t.description}`)
  );

  // Format timestamps in YouTube's required format (MM:SS or HH:MM:SS)
  const youtubeTimestamps = aiTimestamps.map((item) => ({
    timestamp: formatTimestamp(item.timestamp, { padHours: false }),
    description: item.description,
  }));

  console.log(`Generated ${youtubeTimestamps.length} YouTube timestamps`);

  return youtubeTimestamps;
}
