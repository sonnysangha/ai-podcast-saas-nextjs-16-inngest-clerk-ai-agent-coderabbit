/**
 * Convex Mutations and Queries for Project Management
 * 
 * This module handles all database operations for podcast projects.
 * Convex provides real-time reactivity - when these mutations run, all subscribed
 * clients automatically receive updates without polling or manual cache invalidation.
 * 
 * Architecture Pattern:
 * - Mutations: Write operations called from Next.js server actions or Inngest functions
 * - Queries: Read operations that React components subscribe to for real-time updates
 * - All functions are fully type-safe with automatic TypeScript generation
 * 
 * Real-time Flow:
 * 1. Inngest calls mutation (e.g., updateJobStatus)
 * 2. Convex updates database
 * 3. All subscribed React components (useQuery) instantly re-render with new data
 * 4. No WebSocket setup, polling, or manual state management required
 */
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Creates a new project record after file upload
 * 
 * Called by: Next.js server action after Vercel Blob upload succeeds
 * 
 * Flow:
 * 1. User uploads file -> Vercel Blob
 * 2. Server action creates project in Convex
 * 3. Server action triggers Inngest workflow
 * 4. Inngest updates this project as processing proceeds
 * 
 * Design Decision: Initialize with all jobStatus as "pending" to avoid null checks in UI
 */
export const createProject = mutation({
  args: {
    userId: v.string(),
    inputUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileDuration: v.optional(v.number()),
    fileFormat: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert new project with initial "uploaded" status
    // All optional fields (transcript, summary, etc.) are omitted initially
    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      inputUrl: args.inputUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileDuration: args.fileDuration,
      fileFormat: args.fileFormat,
      mimeType: args.mimeType,
      status: "uploaded",
      // Initialize all jobs as pending for UI state tracking
      jobStatus: {
        transcription: "pending",
        keyMoments: "pending",
        summary: "pending",
        captions: "pending",
        social: "pending",
        titles: "pending",
        hashtags: "pending",
        youtubeTimestamps: "pending",
      },
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Updates the overall project status
 * 
 * Called by: Inngest workflow at key milestones
 * - "uploaded" -> "processing" when workflow starts
 * - "processing" -> "completed" when all jobs finish successfully
 * - Any status -> "failed" on error
 * 
 * Real-time Impact: UI components subscribed to this project instantly reflect the new status
 */
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"projects">> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Track completion time for analytics and billing
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.projectId, updates);
  },
});

/**
 * Updates individual job status within a project
 * 
 * Called by: Inngest step functions before and after each AI generation task
 * 
 * Granular Status Tracking Pattern:
 * - Each job (transcription, summary, keyMoments, etc.) has independent status
 * - Enables detailed progress visualization in the UI
 * - Allows parallel job execution without losing per-job state
 * 
 * Example Flow:
 * 1. Transcription: pending -> running -> completed
 * 2. Summary, KeyMoments, etc. (in parallel): pending -> running -> completed
 * 
 * Design Decision: Use mutation for each job update (not batched) so UI updates in real-time
 */
export const updateJobStatus = mutation({
  args: {
    projectId: v.id("projects"),
    job: v.union(
      v.literal("transcription"),
      v.literal("keyMoments"),
      v.literal("summary"),
      v.literal("captions"),
      v.literal("social"),
      v.literal("titles"),
      v.literal("hashtags"),
      v.literal("youtubeTimestamps")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped")
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Merge new job status with existing statuses
    // This preserves other jobs' states when updating a single job
    await ctx.db.patch(args.projectId, {
      jobStatus: {
        ...project.jobStatus,
        [args.job]: args.status,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Saves the transcript from AssemblyAI
 * 
 * Called by: Inngest transcription step after AssemblyAI completes
 * 
 * Data Structure:
 * - text: Full transcript as one string
 * - segments: Time-coded chunks with word-level timing
 * - speakers: Speaker diarization data (who said what)
 * 
 * Design Decision: Store full transcript in Convex (not Blob) for:
 * - Fast querying and display
 * - Real-time updates as transcription completes
 * - No additional HTTP request to load transcript
 */
export const saveTranscript = mutation({
  args: {
    projectId: v.id("projects"),
    transcript: v.object({
      text: v.string(),
      segments: v.array(
        v.object({
          id: v.number(),
          start: v.number(),
          end: v.number(),
          text: v.string(),
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
      speakers: v.optional(
        v.array(
          v.object({
            speaker: v.string(),
            start: v.number(),
            end: v.number(),
            text: v.string(),
            confidence: v.number(),
          })
        )
      ),
    }),
  },
  handler: async (ctx, args) => {
    // Store transcript directly in Convex for instant access
    await ctx.db.patch(args.projectId, {
      transcript: args.transcript,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Saves all AI-generated content in a single atomic operation
 * 
 * Called by: Inngest save-to-convex step after all parallel AI jobs complete
 * 
 * Atomic Batch Update Pattern:
 * - Receives results from 6 parallel AI generation steps
 * - Writes all fields in one mutation for data consistency
 * - UI subscribers receive one update with all new data at once
 * 
 * Design Decision: Single mutation vs. multiple mutations
 * - Pro: Atomic - all content appears together, no partial states
 * - Pro: One database transaction = faster and more consistent
 * - Con: Slightly delays UI updates until all jobs finish
 * - Trade-off: Consistency over incremental updates (better UX for this use case)
 */
export const saveGeneratedContent = mutation({
  args: {
    projectId: v.id("projects"),
    keyMoments: v.optional(
      v.array(
        v.object({
          time: v.string(),
          timestamp: v.number(),
          text: v.string(),
          description: v.string(),
        })
      )
    ),
    summary: v.optional(
      v.object({
        full: v.string(),
        bullets: v.array(v.string()),
        insights: v.array(v.string()),
        tldr: v.string(),
      })
    ),
    socialPosts: v.optional(
      v.object({
        twitter: v.string(),
        linkedin: v.string(),
        instagram: v.string(),
        tiktok: v.string(),
        youtube: v.string(),
        facebook: v.string(),
      })
    ),
    titles: v.optional(
      v.object({
        youtubeShort: v.array(v.string()),
        youtubeLong: v.array(v.string()),
        podcastTitles: v.array(v.string()),
        seoKeywords: v.array(v.string()),
      })
    ),
    hashtags: v.optional(
      v.object({
        youtube: v.array(v.string()),
        instagram: v.array(v.string()),
        tiktok: v.array(v.string()),
        linkedin: v.array(v.string()),
        twitter: v.array(v.string()),
      })
    ),
    youtubeTimestamps: v.optional(
      v.array(
        v.object({
          timestamp: v.string(),
          description: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { projectId, ...content } = args;

    // Spread all optional content fields (summary, keyMoments, socialPosts, etc.)
    // Only provided fields are updated, others remain unchanged
    await ctx.db.patch(projectId, {
      ...content,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Updates processing metrics for analytics
 * 
 * Called by: Inngest workflow (optional - for tracking costs and performance)
 * 
 * Metrics Use Cases:
 * - Track API costs (tokens used)
 * - Measure processing time for optimization
 * - Identify bottlenecks in the pipeline
 * - Calculate per-project costs for billing
 */
export const updateMetrics = mutation({
  args: {
    projectId: v.id("projects"),
    metrics: v.object({
      totalProcessingTime: v.optional(v.number()),
      transcriptionTokens: v.optional(v.number()),
      generationTokens: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Merge new metrics with existing ones (additive updates)
    const updatedMetrics = {
      ...project.metrics,
      ...args.metrics,
    };

    await ctx.db.patch(args.projectId, {
      metrics: updatedMetrics,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Records an error when processing fails
 * 
 * Called by: Inngest step functions on exception
 * 
 * Error Handling Strategy:
 * - Set project status to "failed" to stop further processing
 * - Store error details for debugging and user support
 * - Preserve all successfully completed data (partial results still viewable)
 * 
 * Design Decision: Don't delete project on failure - allow user to retry or view partial results
 */
export const recordError = mutation({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    step: v.string(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Mark project as failed and store error details
    await ctx.db.patch(args.projectId, {
      status: "failed",
      error: {
        message: args.message,
        step: args.step,
        timestamp: Date.now(),
        details: args.details,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Retrieves a single project by ID
 * 
 * Used by: Project detail page (real-time subscription)
 * 
 * Real-time Pattern:
 * - React component: const project = useQuery(api.projects.getProject, { projectId })
 * - Convex automatically re-runs this query when the project updates
 * - Component re-renders with fresh data
 * - No manual refetching or cache invalidation needed
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Simple ID lookup - Convex makes this extremely fast
    return await ctx.db.get(args.projectId);
  },
});

/**
 * Lists all projects for a user with pagination
 * 
 * Used by: Projects dashboard page
 * 
 * Pagination Pattern:
 * - Returns { page: [...], continueCursor: "..." } for infinite scroll
 * - Uses index "by_user" for efficient filtering
 * - Sorted by newest first (order("desc"))
 * 
 * Real-time Behavior:
 * - As new projects are created, they automatically appear in the list
 * - As projects complete, their status updates instantly
 * - No polling required - Convex handles reactivity
 */
export const listUserProjects = query({
  args: {
    userId: v.string(),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const numItems = args.paginationOpts?.numItems ?? 20;

    // Use index for fast filtering by userId
    // order("desc") sorts by _creationTime descending (newest first)
    const query = ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    // Built-in pagination with cursor support
    return await query.paginate({
      numItems,
      cursor: args.paginationOpts?.cursor ?? null,
    });
  },
});
