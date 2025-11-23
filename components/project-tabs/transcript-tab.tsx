"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscriptTabProps {
  transcript: {
    speakers?: {
      speaker: string;
      text: string;
      start: number;
      confidence: number;
    }[];
  };
}

export function TranscriptTab({ transcript }: TranscriptTabProps) {
  const hasSpeakers = transcript.speakers && transcript.speakers.length > 0;

  return (
    <div className="space-y-4">
      {/* Basic Transcript - Available to All */}
      <Card>
        <CardHeader>
          <CardTitle>Full Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">
            {transcript.speakers
              ? transcript.speakers.map((s) => s.text).join(" ")
              : "Transcript not available"}
          </p>
        </CardContent>
      </Card>

      {/* Speaker Diarization - Only show for Ultra users who have it */}
      {hasSpeakers && (
        <Card>
          <CardHeader>
            <CardTitle>Speaker Dialogue</CardTitle>
            <p className="text-sm text-muted-foreground">
              AssemblyAI identified{" "}
              {new Set(transcript.speakers?.map((s) => s.speaker)).size}{" "}
              speaker(s) in this podcast
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transcript.speakers?.map((utterance) => (
                <div
                  key={`${utterance.start}-${utterance.speaker}`}
                  className="flex gap-4 items-start"
                >
                  <Badge
                    variant={
                      utterance.speaker === "A" ? "default" : "secondary"
                    }
                    className="h-fit min-w-[80px] justify-center"
                  >
                    Speaker {utterance.speaker}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {new Date(utterance.start * 1000)
                          .toISOString()
                          .substr(11, 8)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(utterance.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p>{utterance.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
