import { AssemblyAI } from "assemblyai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  type TranscriptWithExtras,
  type AssemblyAISegment,
  type AssemblyAIChapter,
  type AssemblyAIUtterance,
  type AssemblyAIWord,
} from "../../types/assemblyai";
import { type PublishFunction } from "../../lib/realtime";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
});

export async function transcribeWithAssemblyAI(
  audioUrl: string,
  projectId: Id<"projects">,
  publish: PublishFunction
): Promise<TranscriptWithExtras> {
  await convex.mutation(api.projects.updateJobStatus, {
    projectId,
    job: "transcription",
    status: "running",
  });

  console.log("Starting AssemblyAI transcription for:", audioUrl);

  try {
    // Submit transcription job to AssemblyAI
    const transcriptResponse = await assemblyai.transcripts.transcribe({
      audio: audioUrl,
      speaker_labels: true,
      auto_chapters: true,
      format_text: true,
    });

    // Check for errors
    if (transcriptResponse.status === "error") {
      throw new Error(
        transcriptResponse.error || "AssemblyAI transcription failed"
      );
    }

    console.log("AssemblyAI transcription completed");

    // Type assertion for AssemblyAI response (their TypeScript types are incomplete)
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

    // Transform AssemblyAI response to our schema
    const assemblySegments: AssemblyAISegment[] = response.segments || [];
    const assemblyChapters: AssemblyAIChapter[] = response.chapters || [];
    const assemblyUtterances: AssemblyAIUtterance[] = response.utterances || [];

    const formattedSegments = assemblySegments.map((segment, idx) => ({
      id: idx,
      start: segment.start,
      end: segment.end,
      text: segment.text,
      words: (segment.words || []).map((word) => ({
        word: word.text,
        start: word.start,
        end: word.end,
      })),
    }));

    const formattedTranscript = {
      text: response.text || "",
      segments: formattedSegments,
    };

    // Transform speaker utterances
    const speakers = assemblyUtterances.map(
      (utterance: AssemblyAIUtterance) => ({
        speaker: utterance.speaker,
        start: utterance.start / 1000,
        end: utterance.end / 1000,
        text: utterance.text,
        confidence: utterance.confidence,
      })
    );

    // Save transcript with speaker info to Convex
    await convex.mutation(api.projects.saveTranscript, {
      projectId,
      transcript: {
        ...formattedTranscript,
        speakers,
      },
    });

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "transcription",
      status: "completed",
    });

    // Return transcript with chapters and utterances for content generation
    return {
      text: response.text || "",
      segments: formattedSegments,
      chapters: assemblyChapters,
      utterances: assemblyUtterances,
      audio_duration: response.audio_duration, // Include audio duration
    };
  } catch (error) {
    console.error("AssemblyAI transcription error:", error);

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "transcription",
      status: "failed",
    });

    await convex.mutation(api.projects.recordError, {
      projectId,
      message: error instanceof Error ? error.message : "Transcription failed",
      step: "transcription",
    });

    throw error;
  }
}
