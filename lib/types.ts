/**
 * Shared type definitions used across the application
 */

/**
 * Phase status for processing workflow
 * Used by UI components to display current processing state
 * Matches Convex schema jobStatus field
 * Status updates flow from Inngest → Convex → UI (via subscriptions)
 */
export type PhaseStatus = "pending" | "running" | "completed" | "failed";

/**
 * Upload status for file uploads
 */
export type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

