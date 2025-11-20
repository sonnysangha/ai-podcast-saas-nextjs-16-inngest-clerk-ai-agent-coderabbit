/**
 * AssemblyAI Type Definitions
 * 
 * Type definitions for AssemblyAI's transcription API responses.
 * AssemblyAI's official TypeScript types are incomplete, so we define our own.
 * 
 * Key Features Used:
 * - Word-level timestamps: Precise timing for each word
 * - Speaker diarization: Who said what (speaker labels A, B, C, etc.)
 * - Auto chapters: AI-detected topic changes with summaries
 * - Segments: Logical chunks of speech (sentence-level)
 * 
 * Data Flow:
 * 1. AssemblyAI returns these structures
 * 2. We transform to match our Convex schema
 * 3. Store in Convex for UI display
 * 4. Use for AI generation prompts
 */

// AssemblyAI API response types

/**
 * Word-level transcription data
 * Each word includes precise start/end timestamps and confidence score
 */
export type AssemblyAIWord = {
  text: string; // The word text
  start: number; // Start time in milliseconds
  end: number; // End time in milliseconds
  confidence?: number; // Transcription confidence (0-1)
};

/**
 * Segment-level transcription data
 * Groups words into logical chunks (typically sentences)
 */
export type AssemblyAISegment = {
  id: number; // Segment identifier
  start: number; // Start time in milliseconds
  end: number; // End time in milliseconds
  text: string; // Segment text
  words?: AssemblyAIWord[]; // Word-level breakdown (optional)
};

/**
 * Formatted segment structure for Convex storage
 * Matches our schema with simplified word structure
 */
export type FormattedSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
};

/**
 * Auto-detected chapter data
 * AssemblyAI's AI identifies topic changes and creates chapters automatically
 */
export type AssemblyAIChapter = {
  start: number; // Chapter start time in milliseconds
  end: number; // Chapter end time in milliseconds
  gist: string; // Brief summary (1-2 words)
  headline: string; // Chapter title
  summary: string; // Detailed chapter description
};

/**
 * Speaker utterance data (speaker diarization)
 * Identifies who spoke, when, and with what confidence
 */
export type AssemblyAIUtterance = {
  start: number; // Utterance start time in milliseconds
  end: number; // Utterance end time in milliseconds
  confidence: number; // Speaker detection confidence (0-1)
  speaker: string; // Speaker label (A, B, C, etc.)
  text: string; // What the speaker said
};

/**
 * Complete transcript with all enriched data
 * This is what we pass to AI generation functions
 */
export type TranscriptWithExtras = {
  text: string; // Full transcript as plain text
  segments: FormattedSegment[]; // Time-coded segments
  chapters: AssemblyAIChapter[]; // AI-detected chapters (used for better summaries)
  utterances: AssemblyAIUtterance[]; // Speaker-attributed text
  audio_duration?: number; // Total audio duration in milliseconds
};
