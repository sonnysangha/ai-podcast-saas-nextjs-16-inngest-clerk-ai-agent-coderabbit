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
    // Initialize jobStatus to "pending" so UI can track progress from the start
    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      inputUrl: args.inputUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileDuration: args.fileDuration,
      fileFormat: args.fileFormat,
      mimeType: args.mimeType,
      status: "uploaded",
      jobStatus: {
        transcription: "pending",
        contentGeneration: "pending",
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
      chapters: v.optional(
        v.array(
          v.object({
            start: v.number(),
            end: v.number(),
            headline: v.string(),
            summary: v.string(),
            gist: v.string(),
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
 * Updates the job status for transcription or content generation phases
 *
 * Called by: Inngest workflow to track progress of individual phases
 * - transcription: "pending" -> "running" -> "completed"/"failed"
 * - contentGeneration: "pending" -> "running" -> "completed"/"failed"
 *
 * Real-time Impact: UI components instantly reflect phase progress
 */
export const updateJobStatus = mutation({
  args: {
    projectId: v.id("projects"),
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
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const updates: Partial<Doc<"projects">> = {
      jobStatus: {
        ...project.jobStatus,
        ...(args.transcription && { transcription: args.transcription }),
        ...(args.contentGeneration && { contentGeneration: args.contentGeneration }),
      },
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.projectId, updates);
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
    details: v.optional(
      v.object({
        statusCode: v.optional(v.number()),
        stack: v.optional(v.string()),
      })
    ),
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
 * Saves errors for individual generation jobs
 *
 * Called by: Inngest workflow when generation steps fail
 * Allows UI to show which specific jobs failed and enable retry
 */
export const saveJobErrors = mutation({
  args: {
    projectId: v.id("projects"),
    jobErrors: v.object({
      keyMoments: v.optional(v.string()),
      summary: v.optional(v.string()),
      socialPosts: v.optional(v.string()),
      titles: v.optional(v.string()),
      hashtags: v.optional(v.string()),
      youtubeTimestamps: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      jobErrors: args.jobErrors,
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
    // Filter out soft-deleted projects
    const query = ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc");

    // Built-in pagination with cursor support
    return await query.paginate({
      numItems,
      cursor: args.paginationOpts?.cursor ?? null,
    });
  },
});

/**
 * Gets project count for a user (for quota enforcement)
 *
 * Called by: Upload validation before allowing new project creation
 *
 * Counting Logic:
 * - includeDeleted = true: Count ALL projects ever created (for FREE tier)
 * - includeDeleted = false: Count only active projects (for PRO tier)
 *
 * This allows FREE users to be limited to 3 total projects ever (can't game the system),
 * while PRO users can delete to free up slots.
 */
export const getUserProjectCount = query({
  args: {
    userId: v.string(),
    includeDeleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Query all projects by this user
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter based on includeDeleted flag
    if (args.includeDeleted) {
      // Count all projects (including soft-deleted ones)
      return projects.length;
    } else {
      // Count only active projects (exclude soft-deleted)
      return projects.filter((p) => !p.deletedAt).length;
    }
  },
});

/**
 * Soft-deletes a project after validating user ownership
 *
 * Called by: Server action after user confirms deletion
 *
 * Soft Delete Pattern:
 * - Sets deletedAt timestamp instead of hard delete
 * - Allows FREE tier counting to include deleted projects
 * - PRO users don't see deleted projects in their count
 * - Returns inputUrl so server action can clean up Vercel Blob
 *
 * Security:
 * - Validates that the requesting user owns the project
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch project to validate ownership and get inputUrl
    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Security check: ensure user owns this project
    if (project.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this project");
    }

    // Soft delete: set deletedAt timestamp instead of hard delete
    // This preserves the record for FREE tier counting
    await ctx.db.patch(args.projectId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Return inputUrl so server action can delete from Blob storage
    return { inputUrl: project.inputUrl };
  },
});

/**
 * Updates the display name of a project
 *
 * Called by: Server action when user edits project title
 *
 * Security:
 * - Validates that the requesting user owns the project
 *
 * Real-time Impact:
 * - All UI components displaying this project instantly update
 */
export const updateProjectDisplayName = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch project to validate ownership
    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Security check: ensure user owns this project
    if (project.userId !== args.userId) {
      throw new Error("Unauthorized: You don't own this project");
    }

    // Update display name
    await ctx.db.patch(args.projectId, {
      displayName: args.displayName.trim(),
      updatedAt: Date.now(),
    });
  },
});
