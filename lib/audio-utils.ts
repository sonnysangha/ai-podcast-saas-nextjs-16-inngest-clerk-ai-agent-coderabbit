/**
 * Audio Utilities
 * 
 * Helpers for extracting and estimating audio file durations.
 * Used in upload flow to provide processing time estimates.
 * 
 * Why Duration Extraction?
 * - Shows users expected processing time before upload
 * - Validates file is valid audio (extraction fails for corrupted files)
 * - Improves UX with accurate progress estimates
 */

/**
 * Extract duration from an audio file using HTML5 Audio API
 * 
 * Creates an in-memory Audio element, loads file metadata, and extracts duration.
 * Works in browser environment only (client-side).
 * 
 * Process:
 * 1. Create object URL from File blob
 * 2. Load into Audio element
 * 3. Extract duration from loadedmetadata event
 * 4. Clean up object URL
 * 
 * Error Handling:
 * - Rejects if file is not valid audio
 * - Rejects if browser can't decode format
 * - Always cleans up object URL (prevents memory leaks)
 * 
 * @param file - Audio File object
 * @returns Duration in seconds (floored to integer)
 * @throws Error if file cannot be loaded or is invalid
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    // Create temporary URL for file (revoked after use)
    const objectUrl = URL.createObjectURL(file);

    // Success: Metadata loaded, duration available
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(objectUrl); // Clean up memory
      resolve(Math.floor(audio.duration)); // Return duration in whole seconds
    });

    // Error: File couldn't be decoded or is corrupted
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl); // Clean up memory
      reject(new Error("Failed to load audio file"));
    });

    // Start loading audio file
    audio.src = objectUrl;
  });
}

/**
 * Estimate duration from file size (fallback)
 * 
 * Rough calculation assuming average bitrate of 128kbps for MP3.
 * Used when duration extraction fails (corrupted metadata, unsupported format).
 * 
 * Formula:
 * - 1 MB at 128kbps ≈ 8 minutes
 * - fileSize (MB) * 8 = duration (minutes)
 * 
 * Accuracy:
 * - ±30% for typical podcast audio (varies by bitrate and format)
 * - Good enough for progress estimates
 * - Not suitable for precise calculations
 * 
 * @param fileSize - File size in bytes
 * @returns Estimated duration in seconds
 */
export function estimateDurationFromSize(fileSize: number): number {
  // Convert bytes to MB, multiply by 8 (minutes per MB), convert to seconds
  return Math.floor((fileSize / (1024 * 1024)) * 8 * 60);
}
