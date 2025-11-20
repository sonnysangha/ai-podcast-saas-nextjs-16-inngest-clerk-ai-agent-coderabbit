/**
 * Upload Dropzone Component
 * 
 * Drag-and-drop file selector with validation and visual feedback.
 * Built on react-dropzone for cross-browser compatibility.
 * 
 * Features:
 * - Drag and drop support
 * - Click to browse files
 * - File type validation (audio formats only)
 * - File size validation
 * - Visual feedback (drag state, errors)
 * - Accessible file input
 * 
 * Supported Audio Formats:
 * - MP3, M4A, WAV, AAC, FLAC, OGG, Opus, WebM
 * - 3GP, 3G2 (mobile formats)
 * - Multiple MIME type variants for cross-browser support
 * 
 * Design Decision: Why so many MIME types?
 * - Browsers report different MIME types for same format
 * - x-m4a vs. mp4 vs. m4a inconsistencies
 * - Ensures consistent behavior across Chrome, Firefox, Safari
 */
"use client";

import { FileAudio, Upload } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void; // Callback when valid file is selected
  disabled?: boolean; // Disable during upload
  maxSize?: number; // Max file size in bytes (default: MAX_FILE_SIZE)
}

export function UploadDropzone({
  onFileSelect,
  disabled = false,
  maxSize = MAX_FILE_SIZE,
}: UploadDropzoneProps) {
  /**
   * Handle accepted files from dropzone
   * 
   * Only takes first file (maxFiles: 1 enforced)
   * Rejected files are handled by react-dropzone
   */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  // react-dropzone configuration and state
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      // Accept configuration: Exhaustive list for cross-browser compatibility
      accept: {
        "audio/mpeg": [".mp3"], // MP3
        "audio/x-m4a": [".m4a"], // M4A (iOS/Apple)
        "audio/wav": [".wav", ".wave"], // WAV
        "audio/x-wav": [".wav", ".wave"], // WAV (alternate MIME)
        "audio/aac": [".aac"], // AAC
        "audio/ogg": [".ogg", ".oga"], // OGG Vorbis
        "audio/opus": [".opus"], // Opus
        "audio/webm": [".webm"], // WebM Audio
        "audio/flac": [".flac"], // FLAC
        "audio/x-flac": [".flac"], // FLAC (alternate MIME)
        "audio/3gpp": [".3gp"], // 3GP
        "audio/3gpp2": [".3g2"], // 3G2
      },
      maxSize, // File size limit (validates before upload)
      maxFiles: 1, // Only allow single file selection
      disabled, // Disable dropzone during upload
    });

  // Extract first rejection error for display
  const errorMessage = fileRejections[0]?.errors[0]?.message;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          // Base styles: Dashed border, clickable, transitions
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
          // Hover state
          "hover:border-primary/50 hover:bg-accent/50",
          // Drag active state (file hovering over dropzone)
          isDragActive && "border-primary bg-accent",
          // Disabled state
          disabled && "opacity-50 cursor-not-allowed",
          // Error state
          errorMessage && "border-destructive",
        )}
      >
        {/* Hidden file input (accessibility) */}
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {/* Icon indicator */}
          <div className="rounded-full bg-primary/10 p-6">
            {isDragActive ? (
              <Upload className="h-10 w-10 text-primary animate-bounce" />
            ) : (
              <FileAudio className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {/* Instructions and info */}
          <div className="space-y-2">
            <p className="text-lg font-semibold">
              {isDragActive
                ? "Drop your podcast file here"
                : "Drag & drop your podcast file"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports audio files: MP3, WAV, M4A, FLAC, OGG, AAC, and more
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Maximum file size: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        </div>
      </div>

      {/* Error message display */}
      {errorMessage && (
        <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
