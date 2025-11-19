import type { TranscriptWithExtras } from "../../types/assemblyai";
import type { step as InngestStep } from "inngest";

type KeyMoment = {
  time: string;
  timestamp: number;
  text: string;
  description: string;
};

export async function generateKeyMoments(
  _step: typeof InngestStep,
  transcript: TranscriptWithExtras
): Promise<KeyMoment[]> {
  console.log("Generating key moments from AssemblyAI chapters");

  // Use AssemblyAI's auto-generated chapters
  const chapters = transcript.chapters || [];

  const keyMoments = chapters.map((chapter) => {
    const startSeconds = chapter.start / 1000;
    const hours = Math.floor(startSeconds / 3600);
    const minutes = Math.floor((startSeconds % 3600) / 60);
    const seconds = Math.floor(startSeconds % 60);

    const timeString = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return {
      time: timeString,
      timestamp: startSeconds,
      text: chapter.headline,
      description: chapter.summary,
    };
  });

  return keyMoments;
}
