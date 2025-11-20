/**
 * Formatting Utilities
 * 
 * Collection of formatters for displaying data in the UI.
 * Handles file sizes, durations, timestamps, and dates with consistent formatting.
 * 
 * Uses established libraries (bytes, date-fns) for robust, localized formatting.
 */
import bytes from "bytes";
import { format } from "date-fns";
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "./constants";

/**
 * Format file size in human-readable format
 * 
 * Examples:
 * - 1024 -> "1 KB"
 * - 1048576 -> "1 MB"
 * - 1073741824 -> "1 GB"
 * 
 * Uses bytes library for consistent cross-platform formatting
 */
export function formatFileSize(size: number): string {
  return bytes(size, { unitSeparator: " " });
}

/**
 * Format duration in MM:SS or HH:MM:SS format
 * 
 * Examples:
 * - 65 seconds -> "1:05"
 * - 3665 seconds -> "1:01:05"
 * 
 * Automatically includes hours only if needed
 * Always pads minutes and seconds with leading zeros
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format timestamp with flexible options
 * 
 * This function provides flexible timestamp formatting for different use cases:
 * - padHours: Whether to show "01:23:45" vs "1:23:45"
 * - forceHours: Whether to always show hours, even if 0 (e.g., "00:05:30" vs "05:30")
 * 
 * Use Cases:
 * - YouTube timestamps: forceHours=false (shortest format)
 * - Key moments: forceHours=true, padHours=true (consistent length)
 * - Video players: forceHours=true (standard format)
 * 
 * Examples:
 * - 65s, default: "01:05"
 * - 65s, padHours=false: "1:05"
 * - 65s, forceHours=true: "00:01:05"
 */
export function formatTimestamp(
  seconds: number,
  options?: {
    padHours?: boolean;
    forceHours?: boolean;
  }
): string {
  const { padHours = true, forceHours = false } = options || {};

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const hoursStr = padHours ? String(hours).padStart(2, "0") : String(hours);
  const minutesStr = String(minutes).padStart(2, "0");
  const secsStr = String(secs).padStart(2, "0");

  if (hours > 0 || forceHours) {
    return `${hoursStr}:${minutesStr}:${secsStr}`;
  }
  return `${minutesStr}:${secsStr}`;
}

/**
 * Format date in full format
 * 
 * Uses date-fns format "PPpp" for localized date and time display
 * Example: "Apr 29, 2023 at 8:30 PM"
 * 
 * Good for: Detail pages, logs, timestamps
 */
export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), "PPpp");
}

/**
 * Format date in smart relative format
 * 
 * Shows relative time for recent dates, absolute date for older ones:
 * - < 1 minute: "Just now"
 * - < 1 hour: "15m ago"
 * - < 24 hours: "3h ago"
 * - < 7 days: "2d ago"
 * - Older: "4/29/2023"
 * 
 * Good for: Lists, feeds, activity streams
 * Improves UX by showing contextually relevant time format
 */
export function formatSmartDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);

  // Less than 1 minute
  if (diffMins < 1) return "Just now";
  // Less than 1 hour
  if (diffMins < 60) return `${diffMins}m ago`;

  // Less than 24 hours
  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  if (diffHours < 24) return `${diffHours}h ago`;

  // Less than 7 days
  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  if (diffDays < 7) return `${diffDays}d ago`;

  // 7+ days: Show date
  return date.toLocaleDateString();
}
