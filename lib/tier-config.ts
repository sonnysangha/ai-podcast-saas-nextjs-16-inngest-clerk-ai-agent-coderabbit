/**
 * Tier Configuration for Feature Gating
 *
 * Defines limits and features for each subscription plan (FREE/PRO/ULTRA).
 * Used throughout the app to enforce plan-based restrictions.
 *
 * Reference: https://clerk.com/docs/nextjs/guides/billing/for-b2c
 */

export type PlanName = "free" | "pro" | "ultra";

export interface PlanLimits {
  maxProjects: number | null; // null = unlimited
  maxFileSize: number; // bytes
  maxDuration: number | null; // seconds, null = unlimited
}

/**
 * Plan limits configuration
 * All size values are in bytes, durations in seconds
 */
export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    maxProjects: 3, // lifetime, including deleted
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxDuration: 600, // 10 minutes
  },
  pro: {
    maxProjects: 30, // active projects only
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxDuration: 7200, // 2 hours
  },
  ultra: {
    maxProjects: null, // unlimited
    maxFileSize: 3 * 1024 * 1024 * 1024, // 3GB
    maxDuration: null, // unlimited
  },
};

/**
 * Feature names corresponding to Clerk billing features
 * These should match the feature identifiers in Clerk Dashboard
 */
export const FEATURES = {
  TRANSCRIPTION: "transcription",
  SUMMARY: "summary",
  SOCIAL_POSTS: "social_posts",
  TITLES: "titles",
  HASHTAGS: "hashtags",
  YOUTUBE_TIMESTAMPS: "youtube_timestamps",
  KEY_MOMENTS: "key_moments",
  SPEAKER_DIARIZATION: "speaker_diarization",
} as const;

export type FeatureName = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Features available to each plan
 * Maps plan names to their available features
 */
export const PLAN_FEATURES: Record<PlanName, FeatureName[]> = {
  free: [FEATURES.TRANSCRIPTION, FEATURES.SUMMARY],
  pro: [
    FEATURES.TRANSCRIPTION,
    FEATURES.SUMMARY,
    FEATURES.SOCIAL_POSTS,
    FEATURES.TITLES,
    FEATURES.HASHTAGS,
  ],
  ultra: [
    FEATURES.TRANSCRIPTION,
    FEATURES.SUMMARY,
    FEATURES.SOCIAL_POSTS,
    FEATURES.TITLES,
    FEATURES.HASHTAGS,
    FEATURES.YOUTUBE_TIMESTAMPS,
    FEATURES.KEY_MOMENTS,
    FEATURES.SPEAKER_DIARIZATION,
  ],
};

/**
 * Human-readable plan names for UI display
 */
export const PLAN_NAMES: Record<PlanName, string> = {
  free: "Free",
  pro: "Pro",
  ultra: "Ultra",
};

/**
 * Price information for upgrade messaging
 */
export const PLAN_PRICES: Record<PlanName, string> = {
  free: "$0",
  pro: "$29/month",
  ultra: "$69/month",
};

