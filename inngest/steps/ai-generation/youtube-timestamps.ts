import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { TranscriptWithExtras } from "../../types/assemblyai";
import {
  publishStepStart,
  publishStepComplete,
  type PublishFunction,
} from "../../lib/realtime";
import { openai } from "../../lib/openai-client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

type YouTubeTimestamp = {
  timestamp: string;
  description: string;
};

/**
 * Format seconds into YouTube timestamp format
 * - MM:SS for times under 1 hour (e.g., "02:57")
 * - H:MM:SS for times over 1 hour (e.g., "1:11:22", no leading zero on hours)
 */
function formatYouTubeTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    // H:MM:SS format (no leading zero on hours)
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  } else {
    // MM:SS format
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }
}

export async function generateYouTubeTimestamps(
  transcript: TranscriptWithExtras,
  projectId: Id<"projects">,
  publish: PublishFunction
): Promise<YouTubeTimestamp[]> {
  await convex.mutation(api.projects.updateJobStatus, {
    projectId,
    job: "youtubeTimestamps",
    status: "running",
  });

  await publishStepStart(
    publish,
    projectId,
    "youtubeTimestamps",
    "Generating YouTube timestamps...",
    40
  );

  console.log(
    "Generating YouTube timestamps from AssemblyAI chapters with AI-enhanced titles"
  );

  // Use AssemblyAI chapters for accurate timing
  const chapters = transcript.chapters || [];

  if (!chapters || chapters.length === 0) {
    throw new Error(
      "No chapters available from AssemblyAI. Cannot generate YouTube timestamps."
    );
  }

  // Ensure we don't exceed YouTube's 100 timestamp limit
  const chaptersToUse = chapters.slice(0, 100);

  console.log(`Using ${chaptersToUse.length} chapters from AssemblyAI`);

  // Prepare chapter data for AI to create engaging titles
  const chapterData = chaptersToUse.map((chapter, idx) => ({
    index: idx,
    timestamp: Math.floor(chapter.start / 1000),
    headline: chapter.headline,
    summary: chapter.summary,
    gist: chapter.gist,
  }));

  // Create a prompt for OpenAI to generate YouTube-friendly titles
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

  const completion = await openai.chat.completions.create({
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
    response_format: { type: "json_object" },
    max_completion_tokens: 1500,
  });

  const content = completion.choices[0]?.message?.content || '{"titles":[]}';

  // Parse the AI response
  let aiTitles: { index: number; title: string }[] = [];
  try {
    const parsed = JSON.parse(content);
    aiTitles = parsed.titles || [];
  } catch (error) {
    console.error("Failed to parse AI titles, using original headlines", error);
  }

  // Create the final timestamps array by combining AssemblyAI timing with AI-generated titles
  const aiTimestamps = chapterData.map((chapter) => {
    const aiTitle = aiTitles.find((t) => t.index === chapter.index);

    return {
      timestamp: chapter.timestamp,
      description: aiTitle?.title || chapter.headline, // Fallback to original headline if AI fails
    };
  });

  console.log(
    `Generated ${aiTimestamps.length} YouTube timestamps:`,
    aiTimestamps.slice(0, 3).map((t) => `${t.timestamp}s: ${t.description}`)
  );

  // Format timestamps in YouTube format
  const youtubeTimestamps = aiTimestamps.map((item) => ({
    timestamp: formatYouTubeTimestamp(item.timestamp),
    description: item.description,
  }));

  console.log(`Generated ${youtubeTimestamps.length} YouTube timestamps`);

  await convex.mutation(api.projects.updateJobStatus, {
    projectId,
    job: "youtubeTimestamps",
    status: "completed",
  });

  await publishStepComplete(
    publish,
    projectId,
    "youtubeTimestamps",
    "YouTube timestamps generated!",
    43
  );

  return youtubeTimestamps;
}
