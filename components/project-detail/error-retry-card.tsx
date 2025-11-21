"use client";

import { retryJob, type RetryableJob } from "@/app/actions/retry-job";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ErrorRetryCardProps {
  projectId: Id<"projects">;
  job: RetryableJob;
  errorMessage: string;
}

export function ErrorRetryCard({
  projectId,
  job,
  errorMessage,
}: ErrorRetryCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    toast.loading(`Retrying ${job}...`, { id: `retry-${job}` });

    try {
      await retryJob(projectId, job);
      toast.success(`Retry started for ${job}`, { id: `retry-${job}` });
    } catch (error) {
      toast.error(`Failed to retry: ${error}`, { id: `retry-${job}` });
      setIsRetrying(false);
    }
  };

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Generation Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
          />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}


