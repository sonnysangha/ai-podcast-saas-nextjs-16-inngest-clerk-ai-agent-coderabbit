/**
 * AssemblyAI Transcription Step
 *
 * Transcribes podcast audio using AssemblyAI's API with advanced features:
 * - Speaker diarization: Identifies who is speaking (always enabled, UI-gated for ULTRA)
 * - Auto chapters: AI-detected topic changes with summaries
 * - Word-level timestamps: Precise timing for each word
 * - Formatted text: Punctuation and capitalization
 *
 * Integration Flow:
 * 1. Receive audio URL from Vercel Blob and user's plan
 * 2. Submit to AssemblyAI with all features enabled
 * 3. AssemblyAI polls until transcription completes
 * 4. Transform response to match our Convex schema
 * 5. Save to Convex (triggers UI update)
 * 6. Return enhanced transcript for AI generation
 *
 * Feature Gating:
 * - Speaker diarization data is always captured during transcription
 * - UI access to speaker dialogue is restricted to ULTRA plan users
 * - Auto chapters and word timestamps for all plans
 *
 * Error Handling:
 * - AssemblyAI errors: Marked as failed, error recorded in Convex
 * - Inngest automatic retries: Transient failures are retried
 * - Status tracking: jobStatus.transcription updated in real-time
 *
 * Design Decision: Why AssemblyAI over OpenAI Whisper?
 * - Speaker diarization: AssemblyAI has better multi-speaker detection
 * - Auto chapters: Helps with AI content generation (better context)
 * - Faster processing: Optimized for speech (vs. Whisper for accuracy)
 * - Async API: Better for long podcasts (no timeout issues)
 */
import { AssemblyAI } from "assemblyai";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import type { PlanName } from "@/lib/tier-config";
import type {
  AssemblyAIChapter,
  AssemblyAISegment,
  AssemblyAIUtterance,
  AssemblyAIWord,
  TranscriptWithExtras,
} from "../../types/assemblyai";

// Initialize AssemblyAI client with API key from environment
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
});

/**
 * Main transcription function called by Inngest workflow
 *
 * @param audioUrl - Public URL to audio file (from Vercel Blob)
 * @param projectId - Convex project ID for status updates
 * @param userPlan - User's subscription plan (for logging, speaker data always captured)
 * @returns TranscriptWithExtras - Enhanced transcript with chapters and speakers
 */
export async function transcribeWithAssemblyAI(
  audioUrl: string,
  projectId: Id<"projects">,
  userPlan: PlanName = "free"
): Promise<TranscriptWithExtras> {
  console.log(
    `Starting AssemblyAI transcription for project ${projectId} (${userPlan} plan)`
  );

  try {
    // Submit transcription job to AssemblyAI
    // This API call blocks until transcription is complete (can take minutes for long files)
    const transcriptResponse = await assemblyai.transcripts.transcribe({
      audio: audioUrl, // Public URL - AssemblyAI downloads the file
      speaker_labels: true, // Always enable speaker diarization (UI-gated for ULTRA)
      auto_chapters: true, // Detect topic changes automatically
      format_text: true, // Add punctuation and capitalization
    });

    // Check for transcription errors
    if (transcriptResponse.status === "error") {
      throw new Error(
        transcriptResponse.error || "AssemblyAI transcription failed"
      );
    }

    console.log("AssemblyAI transcription completed");

    // Type assertion: AssemblyAI's TypeScript types are incomplete
    // We manually define the full response structure in our types file
    const response = transcriptResponse as unknown as {
      text: string;
      segments: AssemblyAISegment[];
      chapters: AssemblyAIChapter[];
      utterances: AssemblyAIUtterance[];
      words: AssemblyAIWord[];
      audio_duration?: number; // Duration in milliseconds
    };

    console.log(
      `Transcribed ${response.words?.length || 0} words, ${
        response.segments?.length || 0
      } segments, ${response.chapters?.length || 0} chapters, ${
        response.utterances?.length || 0
      } speakers`
    );

    // Transform AssemblyAI response to match our Convex schema
    const assemblySegments: AssemblyAISegment[] = response.segments || [];
    const assemblyChapters: AssemblyAIChapter[] = response.chapters || [];
    const assemblyUtterances: AssemblyAIUtterance[] = response.utterances || [];

    // Format segments with word-level timing data
    const formattedSegments = assemblySegments.map((segment, idx) => ({
      id: idx,
      start: segment.start,
      end: segment.end,
      text: segment.text,
      // Transform word structure to match Convex schema
      words: (segment.words || []).map((word) => ({
        word: word.text,
        start: word.start,
        end: word.end,
      })),
    }));

    // Prepare transcript object for Convex
    const formattedTranscript = {
      text: response.text || "",
      segments: formattedSegments,
    };

    // Transform speaker utterances (convert milliseconds to seconds for consistency)
    const speakers = assemblyUtterances.map(
      (utterance: AssemblyAIUtterance) => ({
        speaker: utterance.speaker,
        start: utterance.start / 1000, // ms to seconds
        end: utterance.end / 1000, // ms to seconds
        text: utterance.text,
        confidence: utterance.confidence,
      })
    );

    // Format chapters for Convex (keep milliseconds as AssemblyAI provides them)
    const chapters = assemblyChapters.map((chapter: AssemblyAIChapter) => ({
      start: chapter.start,
      end: chapter.end,
      headline: chapter.headline,
      summary: chapter.summary,
      gist: chapter.gist,
    }));

    // Save complete transcript with speakers AND chapters to Convex
    // This ensures retry jobs have all the data they need
    await convex.mutation(api.projects.saveTranscript, {
      projectId,
      transcript: {
        ...formattedTranscript,
        speakers,
        chapters, // Include chapters so retry can access them
      },
    });

    // Return enhanced transcript for AI generation steps
    // Includes chapters and utterances which help improve AI content quality
    return {
      text: response.text || "",
      segments: formattedSegments,
      chapters: assemblyChapters,
      utterances: assemblyUtterances,
      audio_duration: response.audio_duration, // Include audio duration
    };
  } catch (error) {
    console.error("AssemblyAI transcription error:", error);

    // Record detailed error for debugging
    await convex.mutation(api.projects.recordError, {
      projectId,
      message: error instanceof Error ? error.message : "Transcription failed",
      step: "transcription",
    });

    // Re-throw to stop workflow execution (Inngest will retry based on config)
    throw error;
  }
}
