// AssemblyAI API response types

export type AssemblyAIWord = {
  text: string;
  start: number;
  end: number;
  confidence?: number;
};

export type AssemblyAISegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: AssemblyAIWord[];
};

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

export type AssemblyAIChapter = {
  start: number;
  end: number;
  gist: string;
  headline: string;
  summary: string;
};

export type AssemblyAIUtterance = {
  start: number;
  end: number;
  confidence: number;
  speaker: string;
  text: string;
};

export type TranscriptWithExtras = {
  text: string;
  segments: FormattedSegment[];
  chapters: AssemblyAIChapter[];
  utterances: AssemblyAIUtterance[];
  audio_duration?: number; // Duration in milliseconds
};
