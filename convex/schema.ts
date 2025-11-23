/**
 * Convex Database Schema
 *
 * Defines the structure of all data stored in Convex for the AI Podcast Assistant.
 * Convex provides real-time reactivity, automatic TypeScript types, and ACID transactions.
 *
 * Key Design Decisions:
 * - Single "projects" table stores all podcast processing data
 * - Denormalized structure (all data in one document) for real-time updates and atomic writes
 * - Optional fields allow progressive data population as Inngest jobs complete
 * - jobStatus tracks each generation step independently for granular UI feedback
 * - Indexes optimize common queries (user's projects, filtering by status, sorting by date)
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    // User ownership - links to Clerk user ID
    userId: v.string(),

    // Soft delete timestamp - allows FREE tier to count all projects ever created
    deletedAt: v.optional(v.number()),

    // Input file metadata - stored in Vercel Blob
    inputUrl: v.string(), // Vercel Blob URL (public access)
    fileName: v.string(), // Original filename for display
    displayName: v.optional(v.string()), // User-editable display name (defaults to fileName in UI)
    fileSize: v.number(), // Bytes - used for billing/limits
    fileDuration: v.optional(v.number()), // Seconds - extracted or estimated
    fileFormat: v.string(), // Extension (mp3, mp4, wav, etc.)
    mimeType: v.string(), // MIME type for validation

    // Overall project status - drives UI state machine
    // uploaded -> processing -> completed (or failed)
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // Granular job status tracking - shows progress of individual processing steps
    jobStatus: v.optional(
      v.object({
        transcription: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed")
          )
        ),
        contentGeneration: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed")
          )
        ),
      })
    ),

    // Error tracking - stores failure details for debugging
    error: v.optional(
      v.object({
        message: v.string(), // User-friendly error message
        step: v.string(), // Which job failed (transcription, summary, etc.)
        timestamp: v.number(), // When the error occurred
        details: v.optional(
          v.object({
            statusCode: v.optional(v.number()), // HTTP status if applicable
            stack: v.optional(v.string()), // Stack trace for debugging
          })
        ),
      })
    ),

    // Per-job error tracking - stores errors for individual generation steps
    jobErrors: v.optional(
      v.object({
        keyMoments: v.optional(v.string()),
        summary: v.optional(v.string()),
        socialPosts: v.optional(v.string()),
        titles: v.optional(v.string()),
        hashtags: v.optional(v.string()),
        youtubeTimestamps: v.optional(v.string()),
      })
    ),

    // Transcript from AssemblyAI - includes word-level timing and speaker detection
    transcript: v.optional(
      v.object({
        text: v.string(), // Full transcript as plain text
        segments: v.array(
          v.object({
            id: v.number(),
            start: v.number(), // Start time in seconds
            end: v.number(), // End time in seconds
            text: v.string(), // Segment text
            words: v.optional(
              v.array(
                v.object({
                  word: v.string(),
                  start: v.number(),
                  end: v.number(),
                })
              )
            ),
          })
        ),
        // Speaker diarization - who said what and when
        speakers: v.optional(
          v.array(
            v.object({
              speaker: v.string(), // Speaker label (A, B, C, etc.)
              start: v.number(),
              end: v.number(),
              text: v.string(),
              confidence: v.number(), // Detection confidence (0-1)
            })
          )
        ),
        // Auto-generated chapters from AssemblyAI
        chapters: v.optional(
          v.array(
            v.object({
              start: v.number(), // Start time in milliseconds
              end: v.number(), // End time in milliseconds
              headline: v.string(), // Chapter title
              summary: v.string(), // Chapter summary
              gist: v.string(), // Short gist
            })
          )
        ),
      })
    ),

    // AI-generated key moments - interesting points for social media clips
    keyMoments: v.optional(
      v.array(
        v.object({
          time: v.string(), // Human-readable time (e.g., "12:34")
          timestamp: v.number(), // Seconds for programmatic use
          text: v.string(), // What was said at this moment
          description: v.string(), // Why this moment is interesting
        })
      )
    ),

    // Podcast summary - multi-format for different use cases
    summary: v.optional(
      v.object({
        full: v.string(), // 200-300 word overview
        bullets: v.array(v.string()), // 5-7 key points
        insights: v.array(v.string()), // 3-5 actionable takeaways
        tldr: v.string(), // One sentence hook
      })
    ),

    // Platform-optimized social media posts
    // Each post is tailored to the platform's best practices and character limits
    socialPosts: v.optional(
      v.object({
        twitter: v.string(), // 280 chars, punchy and engaging
        linkedin: v.string(), // Professional tone, longer form
        instagram: v.string(), // Visual description + engagement hooks
        tiktok: v.string(), // Casual, trend-aware
        youtube: v.string(), // Description with timestamps and CTAs
        facebook: v.string(), // Community-focused, conversation starters
      })
    ),

    // Title suggestions for various contexts
    titles: v.optional(
      v.object({
        youtubeShort: v.array(v.string()), // Catchy, clickable (60 chars)
        youtubeLong: v.array(v.string()), // Descriptive, SEO-friendly
        podcastTitles: v.array(v.string()), // Episode titles
        seoKeywords: v.array(v.string()), // Keywords for discoverability
      })
    ),

    // Platform-specific hashtag recommendations
    hashtags: v.optional(
      v.object({
        youtube: v.array(v.string()),
        instagram: v.array(v.string()),
        tiktok: v.array(v.string()),
        linkedin: v.array(v.string()),
        twitter: v.array(v.string()),
      })
    ),

    // YouTube chapter timestamps - enhances navigation and watch time
    youtubeTimestamps: v.optional(
      v.array(
        v.object({
          timestamp: v.string(), // Format: "12:34"
          description: v.string(), // Chapter title/description
        })
      )
    ),

    // Timestamp metadata
    createdAt: v.number(), // Project creation time
    updatedAt: v.number(), // Last modification time
    completedAt: v.optional(v.number()), // When processing finished
  })
    // Indexes for efficient queries
    .index("by_user", ["userId"]) // List all projects for a user
    .index("by_status", ["status"]) // Filter by processing status
    .index("by_user_and_status", ["userId", "status"]) // User's active/completed projects
    .index("by_created_at", ["createdAt"]), // Sort by newest first
});
