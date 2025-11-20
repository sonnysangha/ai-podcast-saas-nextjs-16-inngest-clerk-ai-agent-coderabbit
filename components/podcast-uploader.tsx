/**
 * Podcast Uploader Component
 *
 * Main orchestration component for podcast file uploads.
 * Manages the complete upload flow from file selection to project creation.
 *
 * Upload Flow:
 * 1. User selects file (via UploadDropzone)
 * 2. Extract audio duration (for time estimates)
 * 3. Upload file to Vercel Blob (direct upload with progress tracking)
 * 4. Create project in Convex (via server action)
 * 5. Trigger Inngest workflow (via server action)
 * 6. Redirect to project detail page
 *
 * State Management:
 * - selectedFile: Current file awaiting upload
 * - fileDuration: Extracted or estimated duration
 * - uploadProgress: 0-100% upload progress
 * - uploadStatus: idle | uploading | processing | completed | error
 *
 * Design Decisions:
 * - Duration extraction: Try to read from audio file, fallback to size-based estimate
 * - Direct upload: Files go to Blob, not through Next.js (handles large files)
 * - Server action: Creates project and triggers workflow atomically
 */
"use client";

import { useAuth } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createProjectAction } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/upload-dropzone";
import { UploadProgress } from "@/components/upload-progress";
import { estimateDurationFromSize, getAudioDuration } from "@/lib/audio-utils";
import type { UploadStatus } from "@/lib/types";

export function PodcastUploader() {
  const router = useRouter();
  const { userId } = useAuth(); // Clerk authentication

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number | undefined>(
    undefined,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle file selection from dropzone
   *
   * Extracts duration for better UX (shows processing time estimates)
   * Falls back to size-based estimation if extraction fails
   */
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);

    // Attempt to extract accurate duration from audio file
    try {
      const duration = await getAudioDuration(file);
      setFileDuration(duration);
      console.log(`Audio duration extracted: ${duration} seconds`);
    } catch (err) {
      // Fallback: Estimate duration based on file size
      // Rough estimate: 1MB ≈ 60 seconds at 128kbps
      console.warn("Could not extract duration from audio file:", err);
      const estimated = estimateDurationFromSize(file.size);
      setFileDuration(estimated);
      console.log(`Using estimated duration: ${estimated} seconds`);
    }
  };

  /**
   * Handle upload button click
   *
   * Upload Flow:
   * 1. Upload to Vercel Blob (with progress tracking)
   * 2. Create project in Convex + trigger Inngest workflow
   * 3. Redirect to project detail page
   *
   * Error Handling:
   * - Shows toast notifications for user feedback
   * - Updates status for visual indicators
   * - Preserves file for retry
   */
  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      // Phase 1: Upload file to Vercel Blob
      setUploadStatus("uploading");
      setUploadProgress(0);

      // upload() handles: pre-signed URL request, file upload, progress tracking
      const blob = await upload(selectedFile.name, selectedFile, {
        access: "public", // Public URLs (could use private with signed URLs)
        handleUploadUrl: "/api/upload", // Route that generates pre-signed URLs
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(percentage);
        },
      });

      // Phase 2: Create project and trigger workflow
      setUploadStatus("processing");
      setUploadProgress(100);

      // Server action: Creates Convex project + sends Inngest event
      const { projectId } = await createProjectAction({
        fileUrl: blob.url,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        fileDuration,
      });

      toast.success("Upload completed! Processing your podcast...");
      setUploadStatus("completed");

      // Phase 3: Navigate to project detail page (shows processing status)
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      setError(err instanceof Error ? err.message : "Failed to upload file");
      toast.error("Upload failed. Please try again.");
    }
  };

  /**
   * Reset upload state to allow new upload
   */
  const handleReset = () => {
    setSelectedFile(null);
    setFileDuration(undefined);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Show dropzone only when no file is selected */}
      {!selectedFile && uploadStatus === "idle" && (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          disabled={uploadStatus !== "idle"}
        />
      )}

      {/* Show progress card when file is selected */}
      {selectedFile && (
        <>
          <UploadProgress
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
            fileDuration={fileDuration}
            progress={uploadProgress}
            status={uploadStatus}
            error={error || undefined}
          />

          {/* Action buttons (only show when idle) */}
          {uploadStatus === "idle" && (
            <div className="flex gap-3">
              <Button onClick={handleUpload} className="flex-1">
                Start Upload
              </Button>
              <Button onClick={handleReset} variant="outline">
                Cancel
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
