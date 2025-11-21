/**
 * Key Moments Generation Step
 *
 * Extracts key moments from AssemblyAI's auto-generated chapters.
 * These moments represent interesting points for social media clips or navigation.
 *
 * Data Source: AssemblyAI Auto Chapters
 * - AssemblyAI's AI detects topic changes automatically
 * - Each chapter has: start time, headline, and summary
 * - No additional AI generation needed (fast and cost-free)
 *
 * Design Decision: Use AssemblyAI chapters vs. GPT analysis
 * - Pro: Fast, no additional API costs
 * - Pro: Reliable timing data from transcription source
 * - Con: Quality depends on AssemblyAI's chapter detection
 * - Trade-off: Good enough for most podcasts, cheaper than GPT analysis
 *
 * Use Cases:
 * - Social media clip selection
 * - Podcast navigation timestamps
 * - Episode highlight reel planning
 */
import { formatTimestamp } from "@/lib/format";
import type { TranscriptWithExtras } from "../../types/assemblyai";

type KeyMoment = {
  time: string; // Human-readable timestamp (e.g., "12:34")
  timestamp: number; // Seconds for programmatic use
  text: string; // Chapter headline
  description: string; // Chapter summary/description
};

/**
 * Transforms AssemblyAI chapters into key moments
 *
 * Transformation:
 * - Converts milliseconds to seconds
 * - Formats timestamp for display (HH:MM:SS or MM:SS)
 * - Maps chapter data to our KeyMoment structure
 *
 * Performance: Near-instant (no AI API call)
 */
export async function generateKeyMoments(
  transcript: TranscriptWithExtras
): Promise<KeyMoment[]> {
  console.log("Generating key moments from AssemblyAI chapters");

  // // 🔥 TEST: Simulate failure to test error handling
  // throw new Error("TEST: Key moments generation failed");

  // Use AssemblyAI's auto-generated chapters as key moments
  const chapters = transcript.chapters || [];

  // If no chapters detected, return empty array
  // This is not an error - some short podcasts may not have distinct chapters
  if (chapters.length === 0) {
    console.log(
      "No chapters detected by AssemblyAI - returning empty key moments"
    );
    return [];
  }

  // Transform each chapter into a key moment with formatted timestamp
  const keyMoments = chapters.map((chapter) => {
    const startSeconds = chapter.start / 1000; // Convert milliseconds to seconds

    return {
      time: formatTimestamp(startSeconds, { padHours: true, forceHours: true }),
      timestamp: startSeconds,
      text: chapter.headline, // Use chapter headline as moment title
      description: chapter.summary, // Use chapter summary as description
    };
  });

  return keyMoments;
}
