"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type YouTubeTimestamp = {
  timestamp: string;
  description: string;
};

type YouTubeTimestampsTabProps = {
  timestamps: YouTubeTimestamp[];
};

export function YouTubeTimestampsTab({
  timestamps,
}: YouTubeTimestampsTabProps) {
  const [copied, setCopied] = useState(false);

  const formattedTimestamps = timestamps
    .map((t) => `${t.timestamp} ${t.description}`)
    .join("\n");

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formattedTimestamps);
      setCopied(true);
      toast.success("Timestamps copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy timestamps");
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>YouTube Timestamps</CardTitle>
        <Button
          onClick={handleCopyAll}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy All
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy these timestamps and paste them into your YouTube video
            description. YouTube will automatically create clickable chapter
            markers.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {formattedTimestamps}
            </pre>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">Individual Timestamps:</h4>
            <div className="space-y-2">
              {timestamps.map((timestamp, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <code className="text-sm font-mono font-semibold text-primary min-w-[60px]">
                    {timestamp.timestamp}
                  </code>
                  <p className="text-sm flex-1">{timestamp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
