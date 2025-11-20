/**
 * Real-time Event Topics for Inngest
 * 
 * These constants define the topics for real-time progress updates sent from
 * Inngest workflows to subscribed frontend clients.
 * 
 * Two-Phase Processing Architecture:
 * 1. Transcription Phase (sequential):
 *    - TRANSCRIPTION_START: AssemblyAI job begins
 *    - TRANSCRIPTION_DONE: Transcript ready, AI generation begins
 * 
 * 2. AI Generation Phase (parallel):
 *    - GENERATION_START: 6 AI jobs start in parallel
 *    - GENERATION_DONE: All AI jobs complete
 * 
 * Frontend Integration:
 * - useProjectRealtime hook subscribes to these topics
 * - UI updates status in real-time without polling
 * - Channel namespacing: `project:${projectId}` isolates updates per project
 * 
 * Design Decision: Coarse-grained topics (phase-level) vs. fine-grained (per-job)
 * - Reduces real-time noise (fewer events)
 * - Sufficient for progress indication (users care about phases, not individual jobs)
 * - Job-level status available via Convex queries if needed
 */

// Real-time topic constants for 2-phase processing
export const REALTIME_TOPICS = {
  // Phase 1: Transcription (sequential)
  TRANSCRIPTION_START: "transcriptionStart",
  TRANSCRIPTION_DONE: "transcriptionDone",

  // Phase 2: AI Generation (parallel - 6 jobs: Summary, Titles, Hashtags, Social, YouTube, Key Moments)
  GENERATION_START: "generationStart",
  GENERATION_DONE: "generationDone",
} as const;
