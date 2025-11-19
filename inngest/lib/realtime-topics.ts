// Realtime topic constants for 2-phase processing
// Phase 1: Transcription
// Phase 2: AI Generation (all 6 outputs in parallel)

export const REALTIME_TOPICS = {
  // Transcription Phase
  TRANSCRIPTION_START: "transcriptionStart",
  TRANSCRIPTION_DONE: "transcriptionDone",

  // AI Generation Phase (Summary, Titles, Hashtags, Social, YouTube, Key Moments)
  GENERATION_START: "generationStart",
  GENERATION_DONE: "generationDone",
} as const;
