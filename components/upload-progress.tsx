/**
 * Upload Progress Component
 *
 * Displays upload status, progress, and file metadata.
 * Provides visual feedback for upload and processing states.
 *
 * States:
 * - uploading: File being uploaded to Blob (0-100% progress)
 * - processing: Creating project and triggering workflow (100% progress)
 * - completed: Ready to view project (shows success message)
 * - error: Upload or processing failed (shows error message)
 *
 * File Metadata Display:
 * - File name (truncated if long)
 * - File size (formatted: MB, GB, etc.)
 * - Duration (if available, formatted: MM:SS or HH:MM:SS)
 * - Status icon (spinner, check, error)
 *
 * Design Decision: Show duration in upload screen
 * - Helps users verify correct file was selected
 * - Provides context for expected processing time
 * - Duration extraction happens before upload starts
 */
"use client";

import { CheckCircle2, Clock, FileAudio, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration, formatFileSize } from "@/lib/format";
import type { UploadStatus } from "@/lib/types";

interface UploadProgressProps {
  fileName: string; // Display name
  fileSize: number; // Bytes
  fileDuration?: number; // Seconds (optional - may not extract successfully)
  progress: number; // 0-100
  status: UploadStatus; // Current state
  error?: string; // Error message if status is "error"
}

export function UploadProgress({
  fileName,
  fileSize,
  fileDuration,
  progress,
  status,
  error,
}: UploadProgressProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* File metadata and status icon */}
          <div className="flex items-start gap-4">
            {/* File icon */}
            <div className="rounded-lg bg-primary/10 p-3">
              <FileAudio className="h-6 w-6 text-primary" />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              {/* File name (truncated if too long) */}
              <p className="font-medium truncate">{fileName}</p>

              {/* Size and duration metadata */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{formatFileSize(fileSize)}</span>
                {fileDuration && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(fileDuration)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status icon (right side) */}
            <div>
              {status === "uploading" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {status === "processing" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {status === "completed" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {status === "error" && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          </div>

          {/* Progress bar (only show during upload/processing) */}
          {(status === "uploading" || status === "processing") && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {status === "uploading" ? "Uploading..." : "Processing..."}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Status message for completed state */}
          {status === "completed" && (
            <p className="text-sm text-green-600">
              Upload completed! Redirecting to project dashboard...
            </p>
          )}

          {/* Error message display */}
          {status === "error" && error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-destructive">Upload Failed</p>
                  <p className="text-sm text-destructive/90">{error}</p>

                  {/* Helpful hints based on error message */}
                  {error.includes("plan limit") && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                      💡 Upgrade your plan to upload larger files or more
                      projects
                    </p>
                  )}
                  {error.includes("Authentication") && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                      💡 Try refreshing the page or signing in again
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
