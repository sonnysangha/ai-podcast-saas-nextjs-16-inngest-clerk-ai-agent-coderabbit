/**
 * Application Constants
 * 
 * Centralized configuration values used across the application.
 * Includes file size limits, allowed formats, timing constants, and UI config.
 */
import type { LucideIcon } from "lucide-react";
import {
  FileSignature,
  Hash,
  Heading,
  MessageSquare,
  Target,
  Youtube,
} from "lucide-react";

// File upload constraints
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

/**
 * Allowed audio MIME types for upload validation
 * 
 * Comprehensive list for cross-browser compatibility:
 * - Different browsers report different MIME types for same format
 * - Includes both standard and vendor-specific types
 * - Validated both client-side (dropzone) and server-side (API route)
 */
export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg", // MP3 (standard)
  "audio/mp3", // MP3 (alternate)
  "audio/mp4", // M4A (standard)
  "audio/m4a", // M4A (alternate)
  "audio/x-m4a", // M4A (Apple)
  "audio/wav", // WAV (standard)
  "audio/x-wav", // WAV (Microsoft)
  "audio/wave", // WAV (alternate)
  "audio/aac", // AAC
  "audio/aacp", // AAC+ 
  "audio/ogg", // OGG Vorbis
  "audio/opus", // Opus
  "audio/webm", // WebM Audio
  "audio/flac", // FLAC (standard)
  "audio/x-flac", // FLAC (alternate)
  "audio/3gpp", // 3GP
  "audio/3gpp2", // 3G2
];

/**
 * Progress animation constants
 * 
 * Used in processing flow for smooth progress indication:
 * - PROGRESS_CAP_PERCENTAGE: Stop at 95% until actual completion (UX best practice)
 * - ANIMATION_INTERVAL_MS: Speed of progress bar animation
 * - PROGRESS_UPDATE_INTERVAL_MS: How often to recalculate progress
 */
export const PROGRESS_CAP_PERCENTAGE = 95;
export const ANIMATION_INTERVAL_MS = 4000;
export const PROGRESS_UPDATE_INTERVAL_MS = 1000;

/**
 * Time conversion constants
 * 
 * Used for duration formatting and time calculations
 */
export const MS_PER_MINUTE = 60000;
export const MS_PER_HOUR = 3600000;
export const MS_PER_DAY = 86400000;

/**
 * UI configuration for generation outputs
 * 
 * Defines the 6 AI generation tasks displayed during processing:
 * - Name: Display name for UI
 * - Icon: Lucide icon component
 * - Description: What the task generates
 * 
 * Used in ProcessingFlow component to show progress
 */
export interface GenerationOutput {
  name: string;
  icon: LucideIcon;
  description: string;
}

export const GENERATION_OUTPUTS: GenerationOutput[] = [
  {
    name: "Summary",
    icon: FileSignature,
    description:
      "Creating comprehensive podcast summary with key insights and takeaways",
  },
  {
    name: "Key Moments",
    icon: Target,
    description:
      "Identifying important timestamps, highlights, and memorable quotes",
  },
  {
    name: "Social Posts",
    icon: MessageSquare,
    description:
      "Crafting platform-optimized posts for Twitter, LinkedIn, Instagram, TikTok, YouTube, and Facebook",
  },
  {
    name: "Titles",
    icon: Heading,
    description:
      "Generating engaging SEO-optimized titles and keywords for maximum reach",
  },
  {
    name: "Hashtags",
    icon: Hash,
    description:
      "Creating trending platform-specific hashtag strategies for better discoverability",
  },
  {
    name: "YouTube Timestamps",
    icon: Youtube,
    description:
      "Formatting clickable chapter markers for YouTube video descriptions",
  },
];
