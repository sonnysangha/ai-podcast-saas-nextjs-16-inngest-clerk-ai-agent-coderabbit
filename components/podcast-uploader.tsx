/**
 * Podcast Uploader Component
 *
 * Main orchestration component for podcast file uploads.
 * Manages the complete upload flow from file selection to project creation.
 *
 * Upload Flow:
 * 1. User selects file (via UploadDropzone)
 * 2. Extract audio duration (for time estimates)
 * 3. Pre-validate against plan limits (via server action)
 * 4. Upload file to Vercel Blob (direct upload with progress tracking)
 * 5. Create project in Convex (via server action)
 * 6. Trigger Inngest workflow (via server action)
 * 7. Redirect to project detail page
 *
 * State Management:
 * - selectedFile: Current file awaiting upload
 * - fileDuration: Extracted or estimated duration
 * - uploadProgress: 0-100% upload progress
 * - uploadStatus: idle | uploading | processing | completed | error
 *
 * Architecture:
 * - Pre-validation via server action prevents cryptic Vercel Blob errors
 * - Direct upload to Blob bypasses Next.js server (handles large files)
 * - Server actions provide type-safe, clean API for validation and project creation
 */
"use client";

import { useAuth } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  createProjectAction,
  validateUploadAction,
} from "@/app/actions/projects";
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
   * 1. Pre-validate upload limits (server action - clean and type-safe)
   * 2. Upload file to Vercel Blob (with progress tracking)
   * 3. Create project and trigger workflow
   * 4. Redirect to project detail page
   */
  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadProgress(0);

      // Step 1: Pre-validate upload using server action
      const validation = await validateUploadAction({
        fileSize: selectedFile.size,
        duration: fileDuration,
      });

      if (!validation.success) {
        throw new Error(validation.error || "Validation failed");
      }

      // Step 2: Upload file to Vercel Blob
      const blob = await upload(selectedFile.name, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(percentage);
        },
      });

      // Step 3: Create project and trigger workflow
      setUploadStatus("processing");
      setUploadProgress(100);

      const { projectId } = await createProjectAction({
        fileUrl: blob.url,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        fileDuration,
      });

      toast.success("Upload completed! Processing your podcast...");
      setUploadStatus("completed");

      // Step 4: Navigate to project detail page
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("error");

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to upload file. Please try again.";

      setError(errorMessage);
      toast.error(errorMessage);
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

          {/* Action buttons (show when idle or error) */}
          {(uploadStatus === "idle" || uploadStatus === "error") && (
            <div className="flex gap-3">
              <Button onClick={handleUpload} className="flex-1">
                {uploadStatus === "error" ? "Try Again" : "Start Upload"}
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
